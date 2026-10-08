import { renderWithProviders, screen, waitFor } from '@/test-utils';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { setSession } from '@/store/authSlice';
import { makeStore } from '@/store';

const mockReplace = jest.fn();
let mockPathname = '/admin/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}));

describe('AuthGuard routing safety', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPathname = '/admin/dashboard';
    window.localStorage.clear();
  });

  it('shows boot loader while not initialised', () => {
    const store = makeStore();
    renderWithProviders(<AuthGuard><div>secret</div></AuthGuard>, { store });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('renders children on public route even when logged out', () => {
    mockPathname = '/admin/login';
    const store = makeStore();
    store.dispatch({ type: 'auth/markInitialised' });
    renderWithProviders(<AuthGuard><div>login-page</div></AuthGuard>, { store });
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('renders protected children when authenticated', () => {
    const store = makeStore();
    store.dispatch(setSession({ accessToken: 'at', expiresInSeconds: 300 }));
    renderWithProviders(<AuthGuard><div>secret</div></AuthGuard>, { store });
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('redirects to login with next param when unauthenticated on private route', async () => {
    mockPathname = '/admin/dashboard';
    const store = makeStore();
    store.dispatch({ type: 'auth/markInitialised' });
    renderWithProviders(<AuthGuard><div>secret</div></AuthGuard>, { store });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('/admin/login?next='),
      );
    });
  });
});
