'use client';

import Link from 'next/link';
import { Box, Paper, Typography } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import StoreIcon from '@mui/icons-material/Store';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { money, topProducts, type ProductRow } from '@/lib/sampleData';
import { ADMIN_HOME_PATH } from '@/lib/panels';

const icons: Record<ProductRow['icon'], React.ReactNode> = {
  bag: <ShoppingBagIcon />,
  box: <Inventory2Icon />,
  pulse: <MonitorHeartIcon />,
  store: <StoreIcon />,
  trend: <TrendingUpIcon />,
};

/** Visual-first ranked list (§5): thumbnail tile + title + sub + trailing value. */
export function TopProducts() {
  return (
    <Paper component="section" aria-labelledby="products-title">
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" id="products-title">
            Top products
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            Best sellers by units · 30 days
          </Typography>
        </Box>
        <Typography
          component={Link}
          href={ADMIN_HOME_PATH}
          aria-disabled="true"
          title="Catalogue management — coming soon"
          onClick={(e) => e.preventDefault()}
          sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'primary.dark', p: 0.5 }}
        >
          Catalog
        </Typography>
      </Box>
      <Box component="ol" sx={{ listStyle: 'none', m: 0, mt: 1.5, p: 0 }}>
        {topProducts.map((p) => (
          <Box
            key={p.name}
            component="li"
            sx={{ display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr) auto', alignItems: 'center', gap: 1.75, py: 1.75, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}
          >
            <Box
              aria-hidden
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 52,
                height: 52,
                borderRadius: '14px',
                color: '#fff',
                background: p.tint,
                '& .MuiSvgIcon-root': { width: 24, height: 24 },
              }}
            >
              {icons[p.icon]}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ display: 'block', fontWeight: 600, lineHeight: 1.3 }}>{p.name}</Typography>
              <Typography variant="caption" color="text.secondary">{p.detail}</Typography>
            </Box>
            <Typography sx={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', fontWeight: 600, textAlign: 'right' }}>
              {money(p.revenue)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
