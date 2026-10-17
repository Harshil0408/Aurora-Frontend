'use client';

import Image from 'next/image';
import { Box, type SxProps, type Theme } from '@mui/material';

export interface ThumbImageProps {
  src: string;
  /** Required — descriptive for content thumbs, '' only when decorative. */
  alt: string;
  /** Box height in px (reserved space — never renders without it). */
  height: number;
  /** Fixed width in px; omit to fill the parent's width (grid cells). */
  width?: number;
  /** `sizes` for responsive (fill) thumbs — required to beat the 100vw default. */
  sizes?: string;
  sx?: SxProps<Theme>;
}

/**
 * Shared fixed-height image thumb (media library, asset fields, future
 * product/avatar use). Enforces reserved space, lazy loading, and a required
 * `alt` so call sites cannot ship CLS or silent images. Same-origin
 * `/uploads/*` sources resolve through the Next rewrite to the optimizer.
 */
export function ThumbImage({ src, alt, height, width, sizes, sx }: ThumbImageProps) {
  if (width != null) {
    return (
      <Box
        sx={{
          position: 'relative',
          width,
          height,
          overflow: 'hidden',
          borderRadius: 1,
          ...sx,
        }}
      >
        <Image src={src} alt={alt} width={width} height={height} style={{ objectFit: 'cover' }} />
      </Box>
    );
  }
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw'}
        style={{ objectFit: 'cover' }}
      />
    </Box>
  );
}
