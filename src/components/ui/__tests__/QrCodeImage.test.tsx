import { renderWithProviders, screen } from '@/test-utils';
import { QrCodeImage } from '@/components/ui/QrCodeImage';

const DATA_URL = 'data:image/png;base64,AAA';

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ alt, src, width, height, unoptimized }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
      width={width}
      height={height}
      data-unoptimized={String(!!unoptimized)}
    />
  ),
}));

describe('QrCodeImage', () => {
  it('renders the data URL unoptimized at the requested size', () => {
    renderWithProviders(<QrCodeImage src={DATA_URL} alt="Setup QR" size={148} />);
    const img = screen.getByRole('img', { name: 'Setup QR' });
    expect(img).toHaveAttribute('src', DATA_URL);
    expect(img).toHaveAttribute('width', '148');
    expect(img).toHaveAttribute('height', '148');
    // data: URLs bypass the optimizer — enforced so call sites cannot forget.
    expect(img).toHaveAttribute('data-unoptimized', 'true');
  });
});
