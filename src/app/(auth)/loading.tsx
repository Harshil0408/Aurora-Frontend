'use client';

import { Box, Skeleton } from '@mui/material';

/** Auth-route stream fallback: centered card-sized skeleton (matches forms). */
export default function AuthLoading() {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420, display: 'grid', gap: 1.5 }}>
        <Skeleton variant="rounded" height={36} />
        <Skeleton variant="rounded" height={44} />
        <Skeleton variant="rounded" height={44} />
        <Skeleton variant="rounded" height={44} />
        <Skeleton variant="rounded" height={44} />
      </Box>
    </Box>
  );
}
