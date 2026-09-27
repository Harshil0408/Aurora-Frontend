import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { LoginForm } from '@/components/auth/LoginForm';

const mockUnwrap = jest.fn();
const mockLogin = jest.fn();
const mockDispatch = jest.fn();

jest.mock('@/services/authApi', () => ({
  useLoginMutation: () => [mockLogin, { isLoading: false }],
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

// next/link -> plain anchor for jsdom
jest.mock('next/link', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => (
    <a href={typeof href === 'string' ? href : '#'} {...rest}>
      {children}
    </a>
  ),
}));

describe('LoginForm (no enumeration, trims + lowercases)', () => {
  beforeEach(() => {
    mockUnwrap.mockReset();
    mockLogin.mockReset();
    mockDispatch.mockClear();
    mockLogin.mockReturnValue({ unwrap: mockUnwrap });
  });

  async function fill(email: string, password: string) {
    const user = userEvent.setup();
    if (email) await user.type(screen.getByLabelText(/Work email/i), email);
    if (password)
      await user.type(screen.getByLabelText(/Password/i), password);
    await user.click(screen.getByRole('button', { name: /Sign in/i }));
  }

  it('shows field errors for bad input and never calls API', async () => {
    renderWithProviders(<LoginForm />);
    await fill('bad', '');
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('lowercases + trims email and dispatches pending on success', async () => {
    mockUnwrap.mockResolvedValueOnce({
      data: { requires2fa: true, channel: 'totp', pendingToken: 'pt', expiresInSeconds: 300 },
    });
    renderWithProviders(<LoginForm />);
    await fill('  ADMIN@Acme.CO ', 's3cret!');
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'admin@acme.co',
      password: 's3cret!',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setPending'),
      }),
    );
  });

  it('direct session when requires2fa=false (no 2FA method)', async () => {
    mockUnwrap.mockResolvedValueOnce({
      data: { requires2fa: false, accessToken: 'at', expiresInSeconds: 300 },
    });
    renderWithProviders(<LoginForm />);
    await fill('a@b.co', 'longenoughpassword');
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setSession'),
      }),
    );
  });

  it('generic error copy (no account enumeration)', async () => {
    mockUnwrap.mockRejectedValueOnce({
      status: 401,
      data: {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'nope' },
      },
    });
    renderWithProviders(<LoginForm />);
    await fill('a@b.co', 'wrongpass1');
    expect(
      await screen.findByText('Invalid email or password.'),
    ).toBeInTheDocument();
    // must not echo backend message verbatim
    expect(screen.queryByText('nope')).toBeNull();
  });

  it('rate-limit copy is distinct', async () => {
    mockUnwrap.mockRejectedValueOnce({
      status: 429,
      data: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'slow down' },
      },
    });
    renderWithProviders(<LoginForm />);
    await fill('a@b.co', 'x1234567');
    expect(
      await screen.findByText(/Too many attempts/i),
    ).toBeInTheDocument();
  });
});
