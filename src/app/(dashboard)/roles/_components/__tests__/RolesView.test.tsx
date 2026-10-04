import { renderWithProviders, screen, userEvent, waitFor, within } from '@/test-utils';
import { RolesView } from '../RolesView';

// Heavy integration suite (full tree + MUI transitions per test).
jest.setTimeout(30000);

const mockMyPermissions = jest.fn();
const mockMeQuery = jest.fn();
const mockListRoles = jest.fn();
const mockRoleDetail = jest.fn();
const mockGroups = jest.fn();
const mockListPermissions = jest.fn();
const mockCreate = jest.fn();
const mockClone = jest.fn();
const mockUpdateMeta = jest.fn();
const mockSave = jest.fn();
const mockStatus = jest.fn();
const mockDeleteRole = jest.fn();

jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: (...args: unknown[]) => mockMyPermissions(...args),
  useListRolesQuery: (...args: unknown[]) => mockListRoles(...args),
  useRoleDetailQuery: (...args: unknown[]) => mockRoleDetail(...args),
  usePermissionGroupsQuery: (...args: unknown[]) => mockGroups(...args),
  useListPermissionsQuery: (...args: unknown[]) => mockListPermissions(...args),
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

const mockNotFound = jest.fn((): never => {
  throw new Error('NEXT_NOT_FOUND');
});

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
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
  mockListRoles.mockReturnValue({
    data: { success: true, data: [SA, SUPPORT, LEGACY] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockRoleDetail.mockImplementation((key: string) => ({
    data: { success: true, data: [SA, SUPPORT, LEGACY].find((r) => r.key === key) ?? SUPPORT },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }));
  mockGroups.mockReturnValue({ data: { success: true, data: GROUPS }, isLoading: false });
  mockListPermissions.mockReturnValue({ data: { success: true, data: [] }, isLoading: false });
}

async function openRowMenu(user: ReturnType<typeof userEvent.setup>, rowName: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${rowName}` }));
}

describe('RolesView (live RBAC wiring)', () => {
  beforeEach(baseMocks);

  it('renders the switcher, summary, and roles table', async () => {
    renderWithProviders(<RolesView />);
    expect(await screen.findByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Choose Roles or Permissions screen' })).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('super_admin', { exact: true })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Roles' });
    expect(within(table).getByText('System')).toBeInTheDocument();
    expect(within(table).getByText('Inactive')).toBeInTheDocument();
  });

  it('renders 404 without role.read even via direct route', async () => {
    mockMyPermissions.mockReturnValue({
      data: { success: true, data: { permissions: ['admin.read'] } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    expect(() => renderWithProviders(<RolesView />)).toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('status filter and search narrow the table', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await user.click(screen.getByRole('button', { name: 'Inactive' }));
    expect(screen.queryByText('Support')).not.toBeInTheDocument();
    expect(screen.getByText('Legacy')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.type(screen.getByRole('searchbox', { name: /Search roles/ }), 'sup');
    await waitFor(() => expect(screen.queryByText('Legacy')).not.toBeInTheDocument());
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('row menu opens the detail matrix; toggling + save sends the full list', async () => {
    const user = userEvent.setup();
    mockSave.mockReturnValue({ unwrap: () => Promise.resolve({ data: { updated: true } }) });
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await openRowMenu(user, 'Support');
    await user.click(screen.getByRole('menuitem', { name: 'View / edit permissions' }));
    // Matrix pre-checks the role grants; INACTIVE rows render locked.
    const readBox = await screen.findByRole('checkbox', { name: /Read admins/ });
    expect(readBox).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Suspend admins/ })).toBeDisabled();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Read admins/ }));
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
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await openRowMenu(user, 'Support');
    await user.click(screen.getByRole('menuitem', { name: 'View / edit permissions' }));
    await screen.findByRole('checkbox', { name: /Read admins/ });
    // Unchecking the only grant routes through the clear-all confirm.
    await user.click(screen.getByRole('checkbox', { name: /Read admins/ }));
    await user.click(screen.getByRole('button', { name: 'Confirm + save' }));
    await user.click(await screen.findByRole('button', { name: 'Clear everything' }));
    expect(await screen.findByText(/Ask a Super Admin/)).toBeInTheDocument();
  });

  it('create modal validates the slug live and sends an explicit empty list', async () => {
    const user = userEvent.setup();
    mockCreate.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: { ...SUPPORT, key: 'catalog-manager', name: 'Catalog Manager', permissions: [], permissionCount: 0 },
        }),
    });
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await user.click(screen.getByRole('button', { name: 'Create Role' }));
    const keyField = screen.getByPlaceholderText('e.g. catalog-manager');
    await user.type(keyField, 'Bad Key!!');
    expect(screen.getByRole('button', { name: 'Next: permissions' })).toBeDisabled();
    await user.clear(keyField);
    await user.type(keyField, 'catalog-manager');
    await user.type(screen.getByPlaceholderText('e.g. Catalog Manager'), 'Catalog Manager');
    await user.click(screen.getByRole('button', { name: 'Next: permissions' }));
    // Nothing checked — the form still sends an explicit empty list (never omitted).
    await user.click(screen.getByRole('button', { name: 'Create empty role' }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        key: 'catalog-manager',
        name: 'Catalog Manager',
        description: undefined,
        permissionKeys: [],
      }),
    );
    expect(await screen.findByText(/Logged to Activity log/)).toBeInTheDocument();
  });

  it('create modal sends the picked starting permissions explicitly', async () => {
    const user = userEvent.setup();
    mockCreate.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: { ...SUPPORT, key: 'billing-analyst', name: 'Billing Analyst', permissions: ['admin.read'], permissionCount: 1 },
        }),
    });
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await user.click(screen.getByRole('button', { name: 'Create Role' }));
    await user.type(screen.getByPlaceholderText('e.g. catalog-manager'), 'billing-analyst');
    await user.type(screen.getByPlaceholderText('e.g. Catalog Manager'), 'Billing Analyst');
    await user.click(screen.getByRole('button', { name: 'Next: permissions' }));
    await user.click(await screen.findByRole('checkbox', { name: /Read admins/ }));
    await user.click(screen.getByRole('button', { name: 'Create with 1' }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        key: 'billing-analyst',
        name: 'Billing Analyst',
        description: undefined,
        permissionKeys: ['admin.read'],
      }),
    );
  });

  it('clone pre-fills from source and status change requires a logged reason', async () => {
    const user = userEvent.setup();
    mockClone.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { ...SUPPORT, key: 'support-eu', name: 'Support EU' } }),
    });
    mockStatus.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { ...SUPPORT, status: 'INACTIVE' } }),
    });
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await openRowMenu(user, 'Support');
    await user.click(screen.getByRole('menuitem', { name: 'Clone' }));
    expect(screen.getByDisplayValue('Help desk')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('e.g. catalog-manager-eu'), 'support-eu');
    await user.click(screen.getByRole('button', { name: 'Clone role' }));
    await waitFor(() =>
      expect(mockClone).toHaveBeenCalledWith({
        sourceKey: 'support',
        body: { key: 'support-eu', name: 'Support (copy)', description: 'Help desk' },
      }),
    );
    // Let the dialog exit before touching the background again.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await openRowMenu(user, 'Support');
    await user.click(screen.getByRole('menuitem', { name: 'Deactivate' }));
    // Reason too short keeps confirm off.
    await user.click(screen.getByRole('button', { name: 'Inactive' }));
    const reason = screen.getByPlaceholderText('e.g. Consolidating support roles');
    await user.type(reason, 'ab');
    expect(screen.getByRole('button', { name: 'Confirm change' })).toBeDisabled();
    await user.clear(reason);
    await user.type(reason, 'Consolidating support roles');
    await user.click(screen.getByRole('button', { name: 'Confirm change' }));
    await waitFor(() =>
      expect(mockStatus).toHaveBeenCalledWith({
        key: 'support',
        body: { status: 'INACTIVE', reason: 'Consolidating support roles' },
      }),
    );
  });

  it('delete needs type-to-confirm and reports assignments on 409', async () => {
    const user = userEvent.setup();
    mockDeleteRole.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 409,
          data: {
            success: false,
            error: { code: 'ROLE_HAS_ASSIGNMENTS', message: 'Still assigned' },
          },
        }),
    });
    renderWithProviders(<RolesView />);
    await screen.findByText('Legacy');
    await openRowMenu(user, 'Legacy');
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Delete role' })).toBeDisabled();
    await user.type(screen.getByPlaceholderText('legacy'), 'legacy');
    await user.click(screen.getByRole('button', { name: 'Delete role' }));
    expect(await screen.findByText(/remove the role from them first/)).toBeInTheDocument();
  });

  it('hides Delete for assigned/system roles and status actions for super_admin', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await openRowMenu(user, 'Support');
    const menu = screen.getByRole('menu');
    expect(within(menu).queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await openRowMenu(user, 'Super Admin');
    const saMenu = screen.getByRole('menu');
    expect(within(saMenu).queryByRole('menuitem', { name: /Activate|Deactivate/ })).not.toBeInTheDocument();
    expect(within(saMenu).queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('super_admin detail locks saving for non–Super Admin viewers', async () => {
    const user = userEvent.setup();
    mockMeQuery.mockReturnValue({ data: { success: true, data: { roles: ['support'] } } });
    renderWithProviders(<RolesView />);
    await screen.findByText('Super Admin');
    await openRowMenu(user, 'Super Admin');
    await user.click(screen.getByRole('menuitem', { name: 'View / edit permissions' }));
    expect(await screen.findByText(/implies all permissions/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm + save' })).toBeDisabled();
  });

  it('permissions screen is a read-only catalog reference', async () => {
    const user = userEvent.setup();
    mockListPermissions.mockReturnValue({
      data: {
        success: true,
        data: [
          {
            key: 'users.ban',
            module: 'users',
            action: 'ban',
            label: 'Ban users',
            description: null,
            status: 'ACTIVE',
            isSystem: false,
            roleCount: 1,
            createdAt: '2024-01-04T10:00:00.000Z',
            updatedAt: '2026-09-18T10:00:00.000Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    renderWithProviders(<RolesView />);
    await screen.findByText('Support');
    await user.click(screen.getByRole('button', { name: 'Show Permissions screen' }));
    expect(await screen.findByText('Ban users')).toBeInTheDocument();
    // No create/edit/delete affordances — keys are code-defined + seeded.
    expect(screen.queryByRole('button', { name: 'Define Permission' })).not.toBeInTheDocument();
    expect(screen.getByText(/code-defined and seeded/)).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Permissions' });
    expect(within(table).queryByRole('button')).not.toBeInTheDocument();
  });
});
