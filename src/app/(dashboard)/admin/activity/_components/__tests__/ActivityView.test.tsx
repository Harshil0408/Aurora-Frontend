import { format, subMonths } from 'date-fns';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { ActivityView } from '../ActivityView';

const mockListQuery = jest.fn();
const mockActionsQuery = jest.fn();
const mockMyPermsQuery = jest.fn();
const mockRefetchList = jest.fn();
const mockNotFound = jest.fn((): never => {
  throw new Error('NEXT_NOT_FOUND');
});

jest.mock('@/services/activityApi', () => ({
  useListActivityQuery: (...args: unknown[]) => mockListQuery(...args),
  useActivityActionsQuery: (...args: unknown[]) => mockActionsQuery(...args),
  useActivityDetailQuery: jest.fn(),
}));

jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: (...args: unknown[]) => mockMyPermsQuery(...args),
}));

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}));

const ENTRY_1 = {
  id: 'cm3x7k9q20001s8n2abcd1234',
  timestamp: '2026-09-21T14:02:00.000Z',
  action: 'admin.roles_updated',
  actionLabel: 'Roles assigned',
  category: 'Admins',
  actor: { id: '1', email: 'aisha@mercato.com', name: 'Aisha Rahman' },
  resource: { type: 'admin', id: '2', label: 'ines@mercato.com' },
  ip: '84.121.9.40',
  userAgent: null,
  changes: [{ field: 'roles', before: 'Sub-Admin', after: 'Sub-Admin, Support' }],
  requestId: 'req-111',
};

const ENTRY_2 = {
  id: 'cm3x7k9q20002s8n2abcd5678',
  timestamp: '2026-09-20T18:44:00.000Z',
  action: 'role.created',
  actionLabel: 'Role created',
  category: 'Roles',
  actor: { id: '', email: 'system', name: 'system' },
  resource: { type: 'role', id: 'finance', label: 'Finance' },
  ip: '',
  userAgent: 'Mozilla/5.0 (Admin Console)',
  changes: [],
  requestId: 'req-222',
};

const ACTIONS = [
  { action: 'admin.roles_updated', label: 'Roles assigned', category: 'Admins', count: 5 },
  { action: 'role.created', label: 'Role created', category: 'Roles', count: 3 },
  { action: 'admin.status_changed', label: 'Status changed', category: 'Admins', count: 2 },
];

function listPayload(rows: unknown[], total = 42, totalPages = 3, page = 1) {
  return {
    data: {
      success: true,
      data: rows,
      pagination: { page, limit: 20, total, totalPages },
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: mockRefetchList,
  };
}

/**
 * List-query calls only — the view also fires an unfiltered-total query
 * ({ page: 1, limit: 1 }) whenever filters are active; those calls carry no
 * filter params and must not be mistaken for list requests.
 */
function listCalls() {
  return mockListQuery.mock.calls.map((c) => c[0]).filter((a) => a?.limit !== 1);
}
function lastListCall() {
  const calls = listCalls();
  return calls[calls.length - 1];
}

describe('ActivityView (live API wiring)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMyPermsQuery.mockReturnValue({
      data: { success: true, data: { permissions: ['audit.read'] } },
      isLoading: false,
    });
    mockListQuery.mockImplementation((args: { limit?: number }) =>
      args?.limit === 1
        ? {
            data: {
              success: true,
              data: [],
              pagination: { page: 1, limit: 1, total: 128, totalPages: 128 },
            },
            isLoading: false,
            isFetching: false,
            isError: false,
            refetch: jest.fn(),
          }
        : listPayload([ENTRY_1, ENTRY_2]),
    );
    mockActionsQuery.mockReturnValue({
      data: { success: true, data: ACTIONS },
      isLoading: false,
      isError: false,
    });
  });

  it('renders live rows, summary strip, and per-type chips — no mock copy', async () => {
    renderWithProviders(<ActivityView />);
    expect(await screen.findByText('ines@mercato.com')).toBeInTheDocument();
    expect(screen.getByText('Aisha Rahman')).toBeInTheDocument();
    // Verbatim snapshots: type + id caption, empty IP renders as em dash.
    expect(screen.getByText('admin · 2')).toBeInTheDocument();
    expect(screen.getByText('Total events')).toBeInTheDocument();
    // No filter active: the list total doubles as the unfiltered total
    // (summary Total + Matching + footer "of N").
    expect(screen.getAllByText('42')).toHaveLength(3);
    expect(screen.getByText('Roles assigned · 5')).toBeInTheDocument();
    // ISO timestamp is formatted client-side (local time — the hour varies
    // by zone; both fixtures land on Sep 21 in positive-offset zones).
    expect(screen.getAllByText(/^Sep 21, 2026 · \d{2}:\d{2}$/)).toHaveLength(2);
    // The raw ISO string is never rendered verbatim (no string-splitting).
    expect(screen.queryByText(/2026-09-21T14:02/)).toBeNull();
    expect(
      screen.getByText((_, el) => el?.textContent === 'Showing 1–2 of 42 events'),
    ).toBeInTheDocument();
  });

  it('expanding a row shows the before/after diff plus request ID', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Expand details for Roles assigned' }));
    expect(await screen.findByText('Sub-Admin, Support')).toBeInTheDocument();
    expect(screen.getByText('Sub-Admin')).toBeInTheDocument();
    expect(screen.getByText('req-111')).toBeInTheDocument();
    expect(
      screen.getByText(/Quote this ID when reporting a problem/),
    ).toBeInTheDocument();
  });

  it('empty changes render the "no field changes" caption and user agent', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    await screen.findByText('Finance');
    await user.click(screen.getByRole('button', { name: 'Expand details for Role created' }));
    expect(await screen.findByText('No field changes recorded')).toBeInTheDocument();
    expect(screen.getByText('Mozilla/5.0 (Admin Console)')).toBeInTheDocument();
    expect(screen.getByText('req-222')).toBeInTheDocument();
  });

  it('debounced search is sent as q and resets to page 1', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    await screen.findByText('ines@mercato.com');
    await user.type(screen.getByRole('searchbox', { name: 'Free-text search' }), 'aisha');
    await waitFor(() => {
      expect(lastListCall()).toEqual(expect.objectContaining({ q: 'aisha', page: 1 }));
    });
    // Filters active → the unfiltered-total query feeds "Total events".
    expect(await screen.findByText('128')).toBeInTheDocument();
  });

  it('action select sends the machine key, not the label', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByLabelText('Action type'));
    await user.click(await screen.findByRole('option', { name: 'Role created — Roles · 3' }));
    await waitFor(() => {
      expect(lastListCall()).toEqual(
        expect.objectContaining({ action: 'role.created', page: 1 }),
      );
    });
  });

  it('pagination footer wires to page / totalPages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    await screen.findByText('ines@mercato.com');
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => {
      expect(lastListCall()).toEqual(expect.objectContaining({ page: 2 }));
    });
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await waitFor(() => {
      expect(lastListCall()).toEqual(expect.objectContaining({ page: 1 }));
    });
  });

  it('query errors render the backend message with a retry action', async () => {
    mockListQuery.mockImplementation((args: { limit?: number }) => {
      if (args?.limit === 1) {
        return {
          data: {
            success: true,
            data: [],
            pagination: { page: 1, limit: 1, total: 0, totalPages: 0 },
          },
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isFetching: false,
        isError: true,
        error: {
          status: 400,
          data: {
            success: false,
            error: { code: 'BAD_REQUEST', message: 'sort must be newest or oldest' },
          },
        },
        refetch: mockRefetchList,
      };
    });
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    expect(await screen.findByText('Could not load activity')).toBeInTheDocument();
    expect(screen.getByText('sort must be newest or oldest')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRefetchList).toHaveBeenCalled();
  });

  it('from-after-to shows the invalid-range state instead of querying', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityView />);
    await screen.findByText('ines@mercato.com');
    // From = today.
    await user.click(screen.getByLabelText('From'));
    await screen.findByRole('dialog', { name: 'From picker' });
    await user.click(screen.getByRole('button', { name: 'Today' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    // To = first day of last month (strictly before today).
    await user.click(screen.getByLabelText('To'));
    await screen.findByRole('dialog', { name: 'To picker' });
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    const earlier = subMonths(new Date(), 1);
    const dayLabel = format(
      new Date(earlier.getFullYear(), earlier.getMonth(), 1),
      'EEEE, MMMM d, yyyy',
    );
    await user.click(screen.getByRole('gridcell', { name: dayLabel }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Invalid date range')).toBeInTheDocument();
    expect(
      screen.getByText('The From day must not be after the To day — adjust the range.'),
    ).toBeInTheDocument();
  }, 30000);

  it('empty log shows the "no activity yet" state', async () => {
    mockListQuery.mockReturnValue(listPayload([], 0, 0));
    mockActionsQuery.mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<ActivityView />);
    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
  });
});
