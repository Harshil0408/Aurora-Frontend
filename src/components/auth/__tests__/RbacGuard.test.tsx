import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { AccessDenied, RbacGuard, useViewerIsSuperAdmin } from '../RbacGuard';

const mockMyPermissions = jest.fn();
const mockMeQuery = jest.fn();

jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: (...args: unknown[]) => mockMyPermissions(...args),
}));

jest.mock('@/services/authApi', () => ({
  useMeQuery: (...args: unknown[]) => mockMeQuery(...args),
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

  it('renders Access Denied when the key is missing', () => {
    mockMyPermissions.mockReturnValue(permsPayload(['admin.read']));
    renderWithProviders(
      <RbacGuard perm="role.read">
        <p>secret</p>
      </RbacGuard>,
    );
    expect(screen.getByRole('alert', { name: 'Access Denied' })).toBeInTheDocument();
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
