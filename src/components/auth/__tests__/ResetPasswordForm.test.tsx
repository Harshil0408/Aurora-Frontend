import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

const mockReplace = jest.fn();
const mockUnwrap = jest.fn();
const mockReset = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/services/authApi', () => ({
  useResetPasswordMutation: () => [mockReset, { isLoading: false }],
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockUnwrap.mockReset();
    mockReset.mockReset();
    mockReset.mockReturnValue({ unwrap: mockUnwrap });
  });

  async function fill(pw: string, confirm: string) {
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/^New password \(12\+ characters\)/i),
      pw,
    );
    await user.type(screen.getByLabelText(/^Confirm new password/i), confirm);
    await user.click(screen.getByRole('button', { name: /Reset password/i }));
  }

  it('rejects short / mismatched passwords locally', async () => {
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill('short1', 'short1');
    expect(await screen.findByText(/12 characters/i)).toBeInTheDocument();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('disables submit without token', () => {
    renderWithProviders(<ResetPasswordForm token="" />);
    expect(screen.getByRole('button', { name: /Reset password/i })).toBeDisabled();
  });

  it('success redirects to login', async () => {
    mockUnwrap.mockResolvedValueOnce({ data: { reset: true } });
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill('long-enough-pass-1', 'long-enough-pass-1');
    expect(mockReset).toHaveBeenCalledWith({
      token: 'tok',
      newPassword: 'long-enough-pass-1',
    });
    // wait for router
    await screen.findByRole('button', { name: /Reset password/i });
    expect(mockReplace).toHaveBeenCalledWith('/admin/login?reset=1');
  });

  it('maps 400 to expired-link copy (good UX)', async () => {
    mockUnwrap.mockRejectedValueOnce({
      status: 400,
      data: { success: false, error: { code: 'BAD_REQUEST', message: 'x' } },
    });
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill('long-enough-pass-1', 'long-enough-pass-1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or expired/i);
  });

  it('surfaces password-rule 400s verbatim (link is still valid)', async () => {
    mockUnwrap.mockRejectedValueOnce({
      status: 400,
      data: {
        success: false,
        error: { code: 'BAD_REQUEST', message: 'New password must not match a recently used password' },
      },
    });
    renderWithProviders(<ResetPasswordForm token="tok" />);
    await fill('long-enough-pass-1', 'long-enough-pass-1');
    expect(await screen.findByRole('alert')).toHaveTextContent(/recently used password/i);
  });
});
