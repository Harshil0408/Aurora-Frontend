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
        // CSS vars (not the MUI palette) so the pre-paint boot script in
        // layout.tsx already shows the saved theme on reload — the server
        // HTML is identical for every theme, only the var values differ.
        bgcolor: 'var(--background)',
        color: 'var(--muted)',
        fontSize: '0.95rem',
      }}
    >
      <CircularProgress aria-hidden sx={{ color: 'var(--brand)' }} />
      {label}…
    </Box>
  );
}

/** Small spinner swapped into buttons during mutations. */
export function ButtonLoader({ label = 'Working' }: { label?: string }) {
  return <CircularProgress size={18} color="inherit" aria-label={label} />;
}
