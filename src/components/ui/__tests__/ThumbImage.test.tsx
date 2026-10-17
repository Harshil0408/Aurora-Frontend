import { renderWithProviders, screen } from '@/test-utils';
import { ThumbImage } from '@/components/ui/ThumbImage';

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ alt, src, width, height, fill, sizes }: any) =>
    fill ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} data-fill sizes={sizes} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} width={width} height={height} />
    ),
}));

describe('ThumbImage', () => {
  it('reserves space with explicit width/height', () => {
    renderWithProviders(
      <ThumbImage src="/uploads/public/a.png" alt="Product photo" width={72} height={72} />,
    );
    const img = screen.getByRole('img', { name: 'Product photo' });
    expect(img).toHaveAttribute('width', '72');
    expect(img).toHaveAttribute('height', '72');
  });

  it('fills its container with a sizes hint when width is omitted', () => {
    renderWithProviders(
      <ThumbImage
        src="/uploads/public/b.png"
        alt="Media thumb"
        height={56}
        sizes="45vw"
      />,
    );
    const img = screen.getByRole('img', { name: 'Media thumb' });
    expect(img).toHaveAttribute('data-fill');
    expect(img).toHaveAttribute('sizes', '45vw');
  });

  it('falls back to a responsive sizes default for fill thumbs', () => {
    renderWithProviders(
      <ThumbImage src="/uploads/public/c.png" alt="Grid thumb" height={56} />,
    );
    const img = screen.getByRole('img', { name: 'Grid thumb' });
    expect(img.getAttribute('sizes')).toBeTruthy();
  });
});
