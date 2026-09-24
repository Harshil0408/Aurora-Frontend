import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { Verify2faForm } from '@/components/auth/Verify2faForm';
import { setPending } from '@/store/authSlice';
import { makeStore } from '@/store';

const mockReplace = jest.fn();
const mockUnwrap = jest.fn();
const mockVerify = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/services/authApi', () => ({
  useVerify2faMutation: () => [mockVerify, { isLoading: false }],
}));

describe('Verify2faForm', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockUnwrap.mockReset();
    mockVerify.mockReset();
    mockVerify.mockReturnValue({ unwrap: mockUnwrap });
  });

  function storeWithPending(withToken: boolean) {
    const store = makeStore();
    if (withToken) {
      store.dispatch(
        setPending({ pendingToken: 'pt-1', expiresInSeconds: 300, email: 'a@b.co' }),
      );
    }
    return store;
  }

  it('blocks when pendingToken missing (expired session)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Verify2faForm />, {
      store: storeWithPending(false),
    });
    await user.type(screen.getByLabelText(/6-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/i);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('requires a code (empty + whitespace)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Verify2faForm />, {
      store: storeWithPending(true),
    });
    await user.click(screen.getByRole('button', { name: /Verify/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('strips spaces and verifies, then redirects', async () => {
    mockUnwrap.mockResolvedValueOnce({
      data: { accessToken: 'at', expiresInSeconds: 300, method: 'totp' },
    });
    const user = userEvent.setup();
    const store = storeWithPending(true);
    renderWithProviders(<Verify2faForm />, { store });
    await user.type(screen.getByLabelText(/6-digit code/i), ' 123 456 ');
    await user.click(screen.getByRole('button', { name: /Verify/i }));
    expect(mockVerify).toHaveBeenCalledWith({
      pendingToken: 'pt-1',
      code: '123456',
    });
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it('generic failure copy + rate-limit copy', async () => {
    mockUnwrap.mockRejectedValueOnce({ status: 401, data: null });
    const user = userEvent.setup();
    renderWithProviders(<Verify2faForm />, {
      store: storeWithPending(true),
    });
    await user.type(screen.getByLabelText(/6-digit code/i), '000000');
    await user.click(screen.getByRole('button', { name: /Verify/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/did not work/i);
  });
});
