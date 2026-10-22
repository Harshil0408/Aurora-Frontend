'use client';

import { Box, Skeleton, Stack } from '@mui/material';

export default function DashboardLoading() {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      sx={{ display: 'grid', gap: 2, py: 3 }}
    >
      <Skeleton variant="text" width={220} sx={{ fontSize: '1.5rem' }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Skeleton variant="rounded" sx={{ flex: 1 }} height={88} />
        <Skeleton variant="rounded" sx={{ flex: 1 }} height={88} />
        <Skeleton variant="rounded" sx={{ flex: 1 }} height={88} />
      </Stack>
      <Skeleton variant="rounded" height={360} />
    </Box>
  );
}
