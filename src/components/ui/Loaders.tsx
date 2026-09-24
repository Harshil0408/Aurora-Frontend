'use client';

import { Box, CircularProgress } from '@mui/material';

/** Full-viewport boot loader used while session bootstrap resolves. */
export function PageLoader({ label = 'Preparing your workspace' }: { label?: string }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.default',
        color: 'text.secondary',
        fontSize: '0.95rem',
      }}
    >
      <CircularProgress color="primary" aria-hidden />
      {label}…
    </Box>
  );
}

/** Small spinner swapped into buttons during mutations. */
export function ButtonLoader({ label = 'Working' }: { label?: string }) {
  return <CircularProgress size={18} color="inherit" aria-label={label} />;
}
