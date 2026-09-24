'use client';

import { Box } from '@mui/material';
import { mercatoTokens } from '@/lib/theme';

/** Live-status pill with a single pulse moment (§3); polite live region. */
export function LivePill({ children }: { children: React.ReactNode }) {
  return (
    <Box
      role="status"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        px: 1.75,
        py: '9px',
        borderRadius: 9999,
        bgcolor: mercatoTokens.goodSoft,
        color: mercatoTokens.good,
        fontSize: '0.82rem',
        fontWeight: 700,
      }}
    >
      <Box component="i" aria-hidden className="mercato-pulse" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: mercatoTokens.good }} />
      {children}
    </Box>
  );
}
