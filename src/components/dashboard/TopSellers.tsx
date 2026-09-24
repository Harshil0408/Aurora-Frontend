'use client';

import Link from 'next/link';
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Delta } from '@/components/dashboard/Delta';
import { int, money, topSellers } from '@/lib/sampleData';
import { mercatoTokens } from '@/lib/theme';

const planTone: Record<string, { bg: string; color: string; border: string }> = {
  Scale: { bg: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong, border: 'transparent' },
  Growth: { bg: mercatoTokens.infoSoft, color: mercatoTokens.info, border: 'transparent' },
  Starter: { bg: 'transparent', color: mercatoTokens.muted, border: mercatoTokens.lineStrong },
};

/**
 * Ranked table with inline bar (§5): seller cell (logo + name + sub),
 * value column pairs the number with a proportional bar, plan as chip.
 */
export function TopSellers() {
  return (
    <Paper component="section" aria-labelledby="sellers-title">
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" id="sellers-title">
            Top performing sellers
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            Ranked by sales this month
          </Typography>
        </Box>
        <Typography
          component={Link}
          href="/dashboard"
          aria-disabled="true"
          title="Seller management — coming soon"
          onClick={(e) => e.preventDefault()}
          sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'primary.dark', p: 0.5 }}
        >
          View all sellers
        </Typography>
      </Box>
      <TableContainer sx={{ mx: -1, mt: 2, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
        <Table aria-label="Top performing sellers" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Seller</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell align="right">Orders</TableCell>
              <TableCell align="right">Sales</TableCell>
              <TableCell>Growth</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topSellers.map((s) => (
              <TableRow key={s.name} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 176 }}>
                    <Box
                      aria-hidden
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                        width: 40,
                        height: 40,
                        borderRadius: 3,
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        color: '#fff',
                        background: s.tint,
                      }}
                    >
                      {s.initial}
                    </Box>
                    <Box>
                      <Typography sx={{ display: 'block', fontWeight: 600, lineHeight: 1.25 }}>{s.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.category}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={s.plan}
                    size="small"
                    sx={{ bgcolor: planTone[s.plan].bg, color: planTone[s.plan].color, border: `1px solid ${planTone[s.plan].border}` }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{int(s.orders)}</TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontWeight: 700 }}>{money(s.sales)}</Typography>
                  <Box aria-hidden sx={{ height: 6, width: 92, ml: 'auto', mt: 0.875, borderRadius: 9999, bgcolor: 'action.hover', border: 1, borderColor: 'divider', overflow: 'hidden' }}>
                    <Box sx={{ display: 'block', height: '100%', width: `${s.barPct}%`, borderRadius: 9999, bgcolor: 'primary.main' }} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Delta pct={s.growthPct} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
