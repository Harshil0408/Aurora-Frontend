'use client';

import { Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { mercatoTokens } from '@/lib/theme';

/** Delta pill: semantic soft bg + direction icon (color never the only signal). */
export function Delta({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Icon = up ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Chip
      size="small"
      icon={<Icon style={{ width: 14, height: 14 }} />}
      label={`${Math.abs(pct).toFixed(1)}%`}
      sx={{
        height: 24,
        fontSize: '0.78rem',
        fontWeight: 700,
        bgcolor: up ? mercatoTokens.goodSoft : mercatoTokens.badSoft,
        color: up ? mercatoTokens.good : mercatoTokens.bad,
        '& .MuiChip-icon': { color: 'inherit', ml: '6px' },
      }}
    />
  );
}
