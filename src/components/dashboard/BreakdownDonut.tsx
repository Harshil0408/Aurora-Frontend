'use client';

import { Box, Paper, Typography } from '@mui/material';
import { compact, revenueSegments } from '@/lib/sampleData';
import { mercatoTokens } from '@/lib/theme';

/**
 * Composition-of-total panel (§5): donut + centre total, segment list
 * (swatch, label, sub-label, amount, %), plus plan-mix stack.
 */
export function BreakdownDonut() {
  const total = revenueSegments.reduce((a, s) => a + s.amount, 0);
  // Starting offset of each segment along the 100-unit circle.
  const offsets = revenueSegments.map((_, i) =>
    revenueSegments.slice(0, i).reduce((a, s) => a + (s.amount / total) * 100, 0),
  );
  const circles = revenueSegments.map((s, i) => {
    const pct = (s.amount / total) * 100;
    const len = pct - 1.8;
    return (
      <circle
        key={s.label}
        cx={70}
        cy={70}
        r={54}
        pathLength={100}
        stroke={s.color}
        strokeWidth={16}
        fill="none"
        strokeDasharray={`${len} ${100 - len}`}
        strokeDashoffset={-(offsets[i] + 0.9)}
        transform="rotate(-90 70 70)"
      />
    );
  });

  return (
    <Paper component="section" aria-labelledby="rev-title">
      <Typography variant="h2" id="rev-title">
        Revenue breakdown
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
        What the platform earned · last 30 days
      </Typography>
      <Box sx={{ position: 'relative', width: 188, height: 188, mx: 'auto', mt: 2.25, mb: 0.75 }}>
        <Box
          component="svg"
          viewBox="0 0 140 140"
          role="img"
          aria-label="Revenue split: commission 67.9%, subscriptions 23.8%, featured listings 8.2%"
          sx={{ width: '100%', height: '100%' }}
        >
          <circle cx={70} cy={70} r={54} fill="none" strokeWidth={16} stroke={mercatoTokens.surface2} />
          {circles}
        </Box>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
          <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.45rem', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {compact(total)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.625 }}>
            Platform revenue
          </Typography>
        </Box>
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, mt: 1.5 }}>
        {revenueSegments.map((s) => (
          <Box
            key={s.label}
            component="li"
            sx={{ display: 'grid', gridTemplateColumns: '12px 1fr auto auto', alignItems: 'center', gap: 1.5, py: 1.5, borderTop: 1, borderColor: 'divider', '&:first-of-type': { borderTop: 0 } }}
          >
            <Box aria-hidden sx={{ width: 12, height: 12, borderRadius: '4px', bgcolor: s.color }} />
            <Box>
              <Typography sx={{ fontWeight: 600 }}>{s.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                {s.sub}
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{`$${s.amount.toLocaleString('en-US')}`}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ minWidth: 46, textAlign: 'right', fontSize: '0.86rem' }}>
              {s.pct.toFixed(1)}%
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 2.25, p: 2, borderRadius: 4, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, fontSize: '0.86rem' }}>
          <Typography sx={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600 }}>1,248 subscribers</Typography>
          <Typography color="text.secondary">$98.4k MRR</Typography>
        </Box>
        <Box role="img" aria-label="Plan mix: Starter 49%, Growth 37.5%, Scale 13.5%" sx={{ display: 'flex', gap: '3px', height: 10, my: 1.5 }}>
          <Box sx={{ flex: 49, bgcolor: mercatoTokens.lineStrong, borderRadius: 9999 }} />
          <Box sx={{ flex: 37.5, bgcolor: mercatoTokens.info, borderRadius: 9999 }} />
          <Box sx={{ flex: 13.5, bgcolor: mercatoTokens.accent, borderRadius: 9999 }} />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.8rem', color: 'text.secondary' }}>
          {[
            { label: 'Starter 612', c: mercatoTokens.lineStrong },
            { label: 'Growth 468', c: mercatoTokens.info },
            { label: 'Scale 168', c: mercatoTokens.accent },
          ].map((p) => (
            <Box key={p.label} component="span">
              <Box component="i" aria-hidden sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', mr: 0.75, bgcolor: p.c }} />
              {p.label}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
