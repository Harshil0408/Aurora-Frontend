'use client';

import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

/**
 * Generic loading surface. Variants: spinner | skeleton | inline.
 * Always paired with real copy — never a bare spinner (content rule §6).
 */
interface DataLoaderProps {
  label?: string;
  variant?: 'spinner' | 'skeleton' | 'inline';
  lines?: number;
}

export function DataLoader({ label = 'Loading', variant = 'spinner', lines = 3 }: DataLoaderProps) {
  if (variant === 'skeleton') {
    return (
      <Box role="status" aria-live="polite" aria-label={label} sx={{ display: 'grid', gap: 1.5 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 3 }} />
        ))}
        <Typography variant="caption" color="text.secondary">
          {label}…
        </Typography>
      </Box>
    );
  }
  if (variant === 'inline') {
    return (
      <Box role="status" aria-live="polite" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} aria-label={label} />
        <Typography variant="caption" color="text.secondary">
          {label}…
        </Typography>
      </Box>
    );
  }
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}
    >
      <CircularProgress aria-hidden />
      <Typography variant="body1" color="text.secondary">
        {label}…
      </Typography>
    </Box>
  );
}
