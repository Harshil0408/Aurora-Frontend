import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { AdminsView } from '../AdminsView';

const mockListQuery = jest.fn();
const mockSummaryQuery = jest.fn();
const mockDetailQuery = jest.fn();
const mockRolesQuery = jest.fn();
const mockTriggerCheck = jest.fn();
const mockTriggerGenerate = jest.fn();
const mockTriggerCreate = jest.fn();
const mockTriggerStatus = jest.fn();
const mockTriggerRoles = jest.fn();
const mockTriggerRevoke = jest.fn();
const mockMeQuery = jest.fn();
const mockReplace = jest.fn();

jest.mock('@/services/adminsApi', () => ({
  useListAdminsQuery: (...args: unknown[]) => mockListQuery(...args),
  useAdminSummaryQuery: (...args: unknown[]) => mockSummaryQuery(...args),
  useAdminDetailQuery: (...args: unknown[]) => mockDetailQuery(...args),
  useListRolesQuery: (...args: unknown[]) => mockRolesQuery(...args),
  useLazyCheckEmailQuery: () => [mockTriggerCheck, { isLoading: false }],
  useGeneratePasswordMutation: () => [mockTriggerGenerate, { isLoading: false }],
  useCreateAdminMutation: () => [mockTriggerCreate, { isLoading: false }],
  useUpdateStatusMutation: () => [mockTriggerStatus, { isLoading: false }],
  useUpdateRolesMutation: () => [mockTriggerRoles, { isLoading: false }],
  useRevokeAdminSessionsMutation: () => [mockTriggerRevoke, { isLoading: false }],
}));

jest.mock('@/services/authApi', () => ({
  useMeQuery: (...args: unknown[]) => mockMeQuery(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const ROLES = [
  { key: 'super_admin', name: 'Super Admin' },
  { key: 'sub_admin', name: 'Sub-Admin' },
  { key: 'support', name: 'Support' },
];

const AISHA = {
  id: '1',
  email: 'aisha@mercato.com',
  name: 'Aisha Rahman',
  status: 'ACTIVE',
  roles: [{ key: 'super_admin', name: 'Super Admin' }],
  twoFactor: { enabled: true, methods: ['totp'] },
  createdAt: '2023-03-04T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  lastLoginAt: '2026-09-21T14:00:00.000Z',
  isSelf: true,
  isLastActiveSuperAdmin: false,
};

const INES = {
  id: '2',
  email: 'ines@mercato.com',
  name: 'Ines Duarte',
  status: 'ACTIVE',
  roles: [
    { key: 'sub_admin', name: 'Sub-Admin' },
    { key: 'support', name: 'Support' },
  ],
  twoFactor: { enabled: false, methods: [] },
  createdAt: '2024-01-04T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
  lastLoginAt: null,
  isSelf: false,
  isLastActiveSuperAdmin: false,
};

function listPayload(rows: unknown[], counts?: Record<string, number>) {
  return {
    data: {
      success: true,
      data: rows,
      pagination: { page: 1, limit: 10, total: rows.length, totalPages: 1 },
      meta: {
        counts: counts ?? { total: 2, active: 2, suspended: 0, disabled: 0 },
        twoFactorEnabled: 1,
      },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  };
}

describe('AdminsView (live API wiring)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListQuery.mockReturnValue(listPayload([AISHA, INES]));
    mockSummaryQuery.mockReturnValue({
      data: {
        success: true,
        data: { total: 2, active: 2, suspended: 0, disabled: 0, needsAttention: 0, twoFactorEnabled: 1 },
      },
    });
    mockRolesQuery.mockReturnValue({ data: { success: true, data: ROLES } });
    mockDetailQuery.mockReturnValue({ data: undefined, isLoading: false });
    mockMeQuery.mockReturnValue({ data: { success: true, data: { roles: ['super_admin'] } } });
    mockTriggerCheck.mockReturnValue({ unwrap: () => Promise.resolve({ data: { available: true } }) });
    mockTriggerGenerate.mockReturnValue({ unwrap: () => Promise.resolve({ data: { password: 'generated-pass-123' } }) });
    mockTriggerCreate.mockReturnValue({ unwrap: () => Promise.resolve({ data: { email: 'x@y.z' } }) });
    mockTriggerStatus.mockReturnValue({ unwrap: () => Promise.resolve({ data: {} }) });
    mockTriggerRoles.mockReturnValue({ unwrap: () => Promise.resolve({ data: { added: [], removed: [] } }) });
    mockTriggerRevoke.mockReturnValue({ unwrap: () => Promise.resolve({ data: { revokedCount: 3 } }) });
  });

  it('renders rows, YOU chip, summary strip, and footer from live queries', async () => {
    renderWithProviders(<AdminsView />);
    expect(await screen.findByText('ines@mercato.com')).toBeInTheDocument();
    expect(screen.getByText('aisha@mercato.com')).toBeInTheDocument();
    expect(screen.getByText('YOU')).toBeInTheDocument();
    expect(screen.getByText('Total admins')).toBeInTheDocument();
    // Footer copy is split across <b> nodes — match the whole text content.
    expect(
      screen.getByText((_, el) => el?.textContent === 'Showing 1–2 of 2 admins'),
    ).toBeInTheDocument();
  });

  it('switching tabs sends the uppercase status to the list query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminsView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('tab', { name: /Suspended/ }));
    await screen.findByText('ines@mercato.com');
    const lastCall = mockListQuery.mock.calls[mockListQuery.mock.calls.length - 1][0];
    expect(lastCall).toEqual(expect.objectContaining({ status: 'SUSPENDED', page: 1 }));
  });

  it('debounced search is sent only at ≥ 2 chars', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminsView />);
    await screen.findByText('ines@mercato.com');
    await user.type(screen.getByRole('searchbox', { name: /Search admins/ }), 'ines');
    // Debounce (300ms) fires after typing settles.
    await waitFor(() => {
      const calls = mockListQuery.mock.calls.map((c) => c[0]);
      expect(calls[calls.length - 1]).toEqual(expect.objectContaining({ search: 'ines' }));
    });
    const calls = mockListQuery.mock.calls.map((c) => c[0]);
    expect(calls.every((a) => a.search === undefined || a.search.length >= 2)).toBe(true);
  });

  it('details dialog renders server activity, not preview copy', async () => {
    const user = userEvent.setup();
    mockDetailQuery.mockReturnValue({
      data: {
        success: true,
        data: {
          ...INES,
          activeSessionsCount: 2,
          recentActivity: [
            {
              id: 'a1',
              action: 'Roles assigned',
              actorEmail: 'aisha@mercato.com',
              ipAddress: '84.121.9.40',
              createdAt: '2026-09-18T10:00:00.000Z',
            },
          ],
        },
      },
      isLoading: false,
    });
    renderWithProviders(<AdminsView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Actions for ines@mercato.com' }));
    await user.click(await screen.findByRole('menuitem', { name: 'View details' }));
    expect(await screen.findByText('Roles assigned')).toBeInTheDocument();
    expect(screen.getByText(/84\.121\.9\.40/)).toBeInTheDocument();
    expect(screen.queryByText(/preview/i)).toBeNull();
  });

  it('create flow surfaces EMAIL_IN_USE as an inline field error', async () => {
    const user = userEvent.setup();
    mockTriggerCheck.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { available: false } }),
    });
    renderWithProviders(<AdminsView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Create Admin' }));
    // paste (not type): one action per field, no per-keystroke table re-renders.
    await user.click(screen.getByLabelText('Full name'));
    await user.paste('New Admin');
    await user.click(screen.getByLabelText('Work email'));
    await user.paste('ines@mercato.com');
    await user.click(screen.getByLabelText(/Temporary password/));
    await user.paste('correct-horse-0427');
    await user.click(screen.getByRole('button', { name: 'Next: roles' }));
    expect(await screen.findByText('This email is already in use.')).toBeInTheDocument();
  });

  it('status 409 LAST_SUPER_ADMIN shows the blocked variant, not a toast', async () => {
    const user = userEvent.setup();
    mockTriggerStatus.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Would leave zero active Super Admins',
              details: { code: 'LAST_SUPER_ADMIN' },
            },
          },
        }),
    });
    renderWithProviders(<AdminsView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Actions for ines@mercato.com' }));
    await user.click(await screen.findByRole('menuitem', { name: /Change status/ }));
    await user.click(screen.getByLabelText(/Reason/));
    await user.paste('Failed KYC re-check');
    await user.click(screen.getByRole('button', { name: 'Confirm change' }));
    expect(await screen.findByText(/Last active Super Admin/)).toBeInTheDocument();
  });

  it('revoke confirms with the server revokedCount', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminsView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Actions for ines@mercato.com' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Revoke sessions' }));
    await user.click(screen.getByRole('button', { name: 'Revoke sessions' }));
    expect(mockTriggerRevoke).toHaveBeenCalledWith('2');
    expect(await screen.findByText('Revoked 3 sessions for ines@mercato.com.')).toBeInTheDocument();
  });

  it('revoking your own sessions signs you out and redirects to login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminsView />);
    await screen.findByText('aisha@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Actions for aisha@mercato.com' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Revoke sessions' }));
    await user.click(screen.getByRole('button', { name: 'Revoke sessions' }));
    expect(mockTriggerRevoke).toHaveBeenCalledWith('1');
    expect(await screen.findByText('Revoked 3 sessions for aisha@mercato.com.')).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
