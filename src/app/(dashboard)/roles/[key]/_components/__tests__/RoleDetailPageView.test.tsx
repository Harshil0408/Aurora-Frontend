import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { makeStore } from '@/store';
import { openRoleDialog, selectRole } from '@/store/rbacSlice';
import { RoleDetailPageView } from '../RoleDetailPageView';

// Detail-page suite (matrix + save bar live on /roles/[key], not the list).
jest.setTimeout(30000);

const mockMyPermissions = jest.fn();
const mockMeQuery = jest.fn();
const mockRoleDetail = jest.fn();
const mockGroups = jest.fn();
const mockSave = jest.fn();
const mockCreate = jest.fn();
const mockClone = jest.fn();
const mockUpdateMeta = jest.fn();
const mockStatus = jest.fn();
const mockDeleteRole = jest.fn();
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };

jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: (...args: unknown[]) => mockMyPermissions(...args),
  useListRolesQuery: () => ({ data: undefined, isLoading: false }),
  useRoleDetailQuery: (...args: unknown[]) => mockRoleDetail(...args),
  usePermissionGroupsQuery: (...args: unknown[]) => mockGroups(...args),
  useListPermissionsQuery: () => ({ data: undefined, isLoading: false }),
  useCreateRoleMutation: () => [mockCreate, { isLoading: false }],
  useCloneRoleMutation: () => [mockClone, { isLoading: false }],
  useUpdateRoleMetaMutation: () => [mockUpdateMeta, { isLoading: false }],
  useReplaceRolePermissionsMutation: () => [mockSave, { isLoading: false }],
  useGrantRolePermissionsMutation: () => [jest.fn(), { isLoading: false }],
  useRevokeRolePermissionsMutation: () => [jest.fn(), { isLoading: false }],
  useUpdateRoleStatusMutation: () => [mockStatus, { isLoading: false }],
  useDeleteRoleMutation: () => [mockDeleteRole, { isLoading: false }],
}));

jest.mock('@/services/authApi', () => ({
  useMeQuery: (...args: unknown[]) => mockMeQuery(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const SUPPORT = {
  key: 'support',
  name: 'Support',
  description: 'Help desk',
  isSystem: false,
  status: 'ACTIVE',
  permissions: ['admin.read'],
  permissionCount: 1,
  assignedAdmins: 1,
  createdAt: '2024-01-04T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
};

const SA = {
  key: 'super_admin',
  name: 'Super Admin',
  description: 'All access',
  isSystem: true,
  status: 'ACTIVE',
  permissions: ['admin.read', 'role.read'],
  permissionCount: 2,
  assignedAdmins: 2,
  createdAt: '2023-03-04T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
};

const LEGACY = {
  key: 'legacy',
  name: 'Legacy',
  description: null,
  isSystem: false,
  status: 'INACTIVE',
  permissions: [],
  permissionCount: 0,
  assignedAdmins: 0,
  createdAt: '2023-03-04T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

const GROUPS = [
  {
    group: 'admin',
    label: 'Admins',
    permissions: [
      {
        key: 'admin.read',
        module: 'admin',
        action: 'read',
        label: 'Read admins',
        description: 'List admins',
        status: 'ACTIVE',
        isSystem: false,
      },
      {
        key: 'admin.suspend',
        module: 'admin',
        action: 'suspend',
        label: 'Suspend admins',
        description: null,
        status: 'INACTIVE',
        isSystem: false,
      },
    ],
  },
];

const FULL_PERMS = ['role.read', 'role.create', 'role.update'];

function baseMocks() {
  jest.clearAllMocks();
  mockMyPermissions.mockReturnValue({
    data: { success: true, data: { permissions: FULL_PERMS } },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockMeQuery.mockReturnValue({ data: { success: true, data: { roles: ['super_admin'] } } });
  mockRoleDetail.mockImplementation((key: string) => ({
    data: { success: true, data: [SA, SUPPORT, LEGACY].find((r) => r.key === key) ?? SUPPORT },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }));
  mockGroups.mockReturnValue({ data: { success: true, data: GROUPS }, isLoading: false });
}

describe('RoleDetailPageView (/roles/[key])', () => {
  beforeEach(baseMocks);

  it('renders the header, back link, and pre-checked matrix', async () => {
    renderWithProviders(<RoleDetailPageView roleKey="support" />);
    expect(await screen.findByRole('heading', { name: 'Support' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All roles' })).toHaveAttribute('href', '/roles');
    const readBox = await screen.findByRole('checkbox', { name: /Read admins/ });
    expect(readBox).toBeChecked();
    // INACTIVE catalog rows render locked, never silently dropped.
    expect(screen.getByRole('checkbox', { name: /Suspend admins/ })).toBeDisabled();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('toggling + save sends the full checked list', async () => {
    const user = userEvent.setup();
    mockSave.mockReturnValue({ unwrap: () => Promise.resolve({ data: { updated: true } }) });
    renderWithProviders(<RoleDetailPageView roleKey="support" />);
    await user.click(await screen.findByRole('checkbox', { name: /Read admins/ }));
    await user.click(screen.getByRole('button', { name: 'Confirm + save' }));
    // Clearing the last grant needs an explicit confirm (full-replace semantics).
    await user.click(await screen.findByRole('button', { name: 'Clear everything' }));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith({ key: 'support', permissionKeys: [] }),
    );
    expect(await screen.findByText(/Logged to Activity log/)).toBeInTheDocument();
  });

  it('save surfaces unheld keys with highlight + guidance', async () => {
    const user = userEvent.setup();
    mockSave.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 403,
          data: {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: "You don't hold these",
              details: { code: 'CANNOT_GRANT_UNHELD_PERMISSION', unheld: ['admin.read'] },
              requestId: 'req-unheld-1',
            },
          },
        }),
    });
    renderWithProviders(<RoleDetailPageView roleKey="support" />);
    await user.click(await screen.findByRole('checkbox', { name: /Read admins/ }));
    await user.click(screen.getByRole('button', { name: 'Confirm + save' }));
    await user.click(await screen.findByRole('button', { name: 'Clear everything' }));
    expect(await screen.findByText(/Ask a Super Admin/)).toBeInTheDocument();
    expect(screen.getByText(/req-unheld-1/)).toBeInTheDocument();
  });

  it('super_admin locks saving for non–Super Admin viewers', async () => {
    mockMeQuery.mockReturnValue({ data: { success: true, data: { roles: ['support'] } } });
    renderWithProviders(<RoleDetailPageView roleKey="super_admin" />);
    expect(await screen.findByText(/implies all permissions/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm + save' })).toBeDisabled();
  });

  it('gone roles offer a refresh that leaves the page', async () => {
    const user = userEvent.setup();
    mockRoleDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 404, data: { success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } } },
      refetch: jest.fn(),
    });
    const store = makeStore();
    store.dispatch(selectRole('support'));
    renderWithProviders(<RoleDetailPageView roleKey="support" />, { store });
    expect(await screen.findByText('Role no longer exists')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh list' }));
    expect(store.getState().rbac.selectedRoleKey).toBeNull();
  });

  it('deleting the role returns to the list', async () => {
    const user = userEvent.setup();
    mockDeleteRole.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { deleted: true } }),
    });
    const store = makeStore();
    store.dispatch(selectRole('legacy'));
    store.dispatch(openRoleDialog({ kind: 'delete', roleKey: 'legacy' }));
    renderWithProviders(<RoleDetailPageView roleKey="legacy" />, { store });
    await user.type(screen.getByPlaceholderText('legacy'), 'legacy');
    await user.click(screen.getByRole('button', { name: 'Delete role' }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/roles'));
  });
});
