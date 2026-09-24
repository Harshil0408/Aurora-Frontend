import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

const mockUnwrap = jest.fn();
const mockForgot = jest.fn();

jest.mock('@/services/authApi', () => ({
  useForgotPasswordMutation: () => [mockForgot, { isLoading: false }],
}));

describe('ForgotPasswordForm (anti-enumeration)', () => {
  beforeEach(() => {
    mockUnwrap.mockReset();
    mockForgot.mockReset();
    mockForgot.mockReturnValue({ unwrap: mockUnwrap });
  });

  it('blocks invalid email locally', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/Work email/i), 'bad');
    await user.click(screen.getByRole('button', { name: /Send reset link/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockForgot).not.toHaveBeenCalled();
  });

  it('always shows same success copy even if API fails (no enumeration)', async () => {
    mockUnwrap.mockRejectedValueOnce({ status: 404 });
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/Work email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /Send reset link/i }));
    expect(
      await screen.findByRole('status'),
    ).toHaveTextContent(/If the account exists/i);
  });

  it('lowercases email before send', async () => {
    mockUnwrap.mockResolvedValueOnce({ data: { message: 'ok' } });
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText(/Work email/i), 'USER@Example.COM');
    await user.click(screen.getByRole('button', { name: /Send reset link/i }));
    expect(mockForgot).toHaveBeenCalledWith({ email: 'user@example.com' });
  });
});
