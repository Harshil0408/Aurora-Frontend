import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { Enroll2fa } from '@/components/auth/Enroll2fa';
import { setPending } from '@/store/authSlice';
import { makeStore } from '@/store';

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @next/next/no-img-element
  default: ({ alt, src, width, height, ...rest }: any) => (
    // Strip Next-only props (priority, etc.) so jsdom doesn't warn
    <img alt={alt} src={src} width={width} height={height} />
  ),
}));

const mockEnrollUnwrap = jest.fn();
const mockEnroll = jest.fn();
const mockConfirmUnwrap = jest.fn();
const mockConfirm = jest.fn();
let mockEnrollData: unknown = null;

jest.mock('@/services/authApi', () => ({
  useEnroll2faMutation: () => [
    mockEnroll,
    { isLoading: false, data: mockEnrollData },
  ],
  useConfirm2faMutation: () => [mockConfirm, { isLoading: false }],
}));

describe('Enroll2fa', () => {
  beforeEach(() => {
    mockEnrollUnwrap.mockReset();
    mockConfirmUnwrap.mockReset();
    mockEnroll.mockReset();
    mockConfirm.mockReset();
    mockEnrollData = null;
    mockEnroll.mockReturnValue({ unwrap: mockEnrollUnwrap });
    mockConfirm.mockReturnValue({ unwrap: mockConfirmUnwrap });
  });

  function storeWithPending() {
    const s = makeStore();
    s.dispatch(
      setPending({ pendingToken: 'pt', expiresInSeconds: 300, email: 'a@b.co' }),
    );
    return s;
  }

  it('shows expired message without pendingToken', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Enroll2fa />, { store: makeStore() });
    await user.click(
      screen.getByRole('button', { name: /Generate setup code/i }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/expired/i);
  });

  it('calls enroll with pendingToken', async () => {
    mockEnrollUnwrap.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();
    renderWithProviders(<Enroll2fa />, { store: storeWithPending() });
    await user.click(
      screen.getByRole('button', { name: /Generate setup code/i }),
    );
    expect(mockEnroll).toHaveBeenCalledWith({ pendingToken: 'pt' });
  });

  it('renders QR + recovery codes once enrolled, then confirms', async () => {
    mockEnrollData = {
      data: {
        otpauthUrl: 'otpauth://x',
        qrDataUrl: 'data:image/png;base64,AAA',
        recoveryCodes: Array.from({ length: 10 }, (_, i) => `CODE-${i}`),
      },
    };
    mockConfirmUnwrap.mockResolvedValueOnce({ data: { enrolled: true } });
    const user = userEvent.setup();
    renderWithProviders(<Enroll2fa />, { store: storeWithPending() });
    expect(
      screen.getByAltText(/QR code to link/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/never shown again/i)).toBeInTheDocument();
    expect(screen.getByText('CODE-0')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/6-digit code from your app/i),
      '123456',
    );
    await user.click(
      screen.getByRole('button', { name: /Confirm authenticator/i }),
    );
    expect(mockConfirm).toHaveBeenCalledWith({
      pendingToken: 'pt',
      code: '123456',
    });
    expect(
      await screen.findByText(/Authenticator linked/i),
    ).toBeInTheDocument();
  });

  it('requires code on confirm', async () => {
    mockEnrollData = {
      data: {
        otpauthUrl: 'x',
        qrDataUrl: 'data:image/png;base64,AAA',
        recoveryCodes: ['A'],
      },
    };
    const user = userEvent.setup();
    renderWithProviders(<Enroll2fa />, { store: storeWithPending() });
    await user.click(
      screen.getByRole('button', { name: /Confirm authenticator/i }),
    );
    expect(
      await screen.findByText(/Enter the 6-digit code/i),
    ).toBeInTheDocument();
    expect(mockConfirm).not.toHaveBeenCalled();
  });
});
