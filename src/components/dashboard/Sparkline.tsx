'use client';

import { Box } from '@mui/material';

/** Tiny area sparkline. Purely decorative (aria-hidden) — value is in text. */
export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 140;
  const H = 46;
  const p = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map(
    (v, i) =>
      [(i * W) / (data.length - 1), p + (H - p * 2 - 2) * (1 - (v - min) / (max - min || 1))] as const,
  );
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line}L${W},${H}L0,${H}Z`;
  return (
    <Box className="spark" aria-hidden sx={{ height: 46, mx: -3, mb: 0, mt: 1.75, color }}>
      <Box
        component="svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        sx={{ display: 'block', width: '100%', height: '100%' }}
      >
        <path d={area} fill="currentColor" opacity={0.1} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </Box>
    </Box>
  );
}
