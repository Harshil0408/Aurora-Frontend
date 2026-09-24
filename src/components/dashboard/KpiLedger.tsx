'use client';

import { Box, Paper, Typography } from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Delta } from '@/components/dashboard/Delta';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { sparkData } from '@/lib/sampleData';

export interface KpiItem {
  key: string;
  label: string;
  valueId?: string;
  value: string;
  deltaPct: number;
  context: React.ReactNode;
  tint: string;
  ink: string;
  icon: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  store: <StoreIcon fontSize="small" />,
  users: <GroupIcon fontSize="small" />,
  orders: <ShoppingBagIcon fontSize="small" />,
  revenue: <AccountBalanceWalletIcon fontSize="small" />,
};

export interface KpiInput extends Omit<KpiItem, 'icon'> {
  icon: 'store' | 'users' | 'orders' | 'revenue';
}

/**
 * KPI ledger (§5): joined strip with hairline dividers; each cell is
 * icon chip + label → big tabular number → delta pill + context → sparkline.
 */
export function KpiLedger({ items, liveIds }: { items: KpiInput[]; liveIds?: Record<string, string> }) {
  return (
    <Paper
      component="section"
      aria-label="Key metrics"
      sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: '3px', overflow: 'hidden', p: 0, mb: 2.5 }}
    >
      {items.map((item) => (
        <Box
          key={item.key}
          component="article"
          sx={{
            bgcolor: item.tint,
            px: 3,
            pt: 2.75,
            pb: 0,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              aria-hidden
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: '#fff',
                color: item.ink,
                boxShadow: `0 6px 14px -8px ${item.ink}`,
              }}
            >
              {iconMap[item.icon]}
            </Box>
            <Typography component="h2" sx={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', color: 'text.secondary' }}>
              {item.label}
            </Typography>
          </Box>
          <Typography
            id={liveIds?.[item.key] ?? item.valueId}
            sx={{ mt: 2, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '2rem', lineHeight: 1, letterSpacing: '-0.035em' }}
          >
            {item.value}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1.5, fontSize: '0.82rem', color: 'text.secondary' }}>
            <Delta pct={item.deltaPct} />
            <Box component="span">{item.context}</Box>
          </Box>
          <Sparkline data={sparkData[item.key] ?? []} color={item.ink} />
        </Box>
      ))}
    </Paper>
  );
}
