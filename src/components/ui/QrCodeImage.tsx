'use client';

import Image from 'next/image';

/**
 * Authenticator QR code. The backend hands over a `data:` URL, which the
 * image optimizer cannot process — `unoptimized` renders the embedded PNG
 * as-is (tiny, already sized). Never mark it `priority`: the QR only mounts
 * after the user starts enrollment, so it is never the LCP element.
 */
export function QrCodeImage({
  src,
  alt,
  size,
}: {
  src: string;
  alt: string;
  size: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized
    />
  );
}
