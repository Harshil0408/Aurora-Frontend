import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { AccessDenied, Can, RbacGuard, useViewerIsSuperAdmin } from '../RbacGuard';

const mockMyPermissions = jest.fn();
const mockMeQuery = jest.fn();
const mockNotFound = jest.fn((): never => {
  throw new Error('NEXT_NOT_FOUND');
});

jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: (...args: unknown[]) => mockMyPermissions(...args),
}));

jest.mock('@/services/authApi', () => ({
  useMeQuery: (...args: unknown[]) => mockMeQuery(...args),
}));

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}));

function permsPayload(permissions: string[]) {
  return {
    data: { success: true, data: { permissions } },
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
  };
}

describe('RbacGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMeQuery.mockReturnValue({ data: undefined });
  });

  it('shows a loader while permissions resolve', () => {
    mockMyPermissions.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(
      <RbacGuard perm="role.read">
        <p>secret</p>
      </RbacGuard>,
    );
    expect(screen.getByLabelText('Checking your permissions')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('calls notFound (404) when the key is missing', () => {
    mockMyPermissions.mockReturnValue(permsPayload(['admin.read']));
    expect(() =>
      renderWithProviders(
        <RbacGuard perm="role.read">
          <p>secret</p>
        </RbacGuard>,
      ),
    ).toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalled();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders children for anyOf matches', () => {
    mockMyPermissions.mockReturnValue(permsPayload(['audit.read']));
    renderWithProviders(
      <RbacGuard anyOf={['admin.read', 'audit.read']}>
        <p>secret</p>
      </RbacGuard>,
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('Can hides gated UI without permission and shows it with permission', () => {
    mockMyPermissions.mockReturnValue(permsPayload(['admin.read']));
    const { unmount } = renderWithProviders(
      <Can perm="admin.create">
        <button>Create Admin</button>
      </Can>,
    );
    expect(screen.queryByRole('button', { name: 'Create Admin' })).not.toBeInTheDocument();
    unmount();
    mockMyPermissions.mockReturnValue(permsPayload(['admin.read', 'admin.create']));
    renderWithProviders(
      <Can perm="admin.create">
        <button>Create Admin</button>
      </Can>,
    );
    expect(screen.getByRole('button', { name: 'Create Admin' })).toBeInTheDocument();
  });

  it('Can returns null while permissions load (no flash of forbidden UI)', () => {
    mockMyPermissions.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(
      <Can perm="admin.create">
        <button>Create Admin</button>
      </Can>,
    );
    expect(screen.queryByRole('button', { name: 'Create Admin' })).not.toBeInTheDocument();
  });

  it('AccessDenied shows a retry action when provided', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<AccessDenied onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('useViewerIsSuperAdmin reflects the me roles', () => {
    function Probe() {
      return <p>{useViewerIsSuperAdmin() ? 'sa-yes' : 'sa-no'}</p>;
    }
    mockMyPermissions.mockReturnValue(permsPayload([]));
    mockMeQuery.mockReturnValue({ data: { success: true, data: { roles: ['support'] } } });
    const { unmount } = renderWithProviders(<Probe />);
    expect(screen.getByText('sa-no')).toBeInTheDocument();
    unmount();
    mockMeQuery.mockReturnValue({ data: { success: true, data: { roles: ['super_admin'] } } });
    renderWithProviders(<Probe />);
    expect(screen.getByText('sa-yes')).toBeInTheDocument();
  });
});
