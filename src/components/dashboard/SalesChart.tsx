'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Delta } from '@/components/dashboard/Delta';
import { compact, int, money, salesData, summarise, type SalesRange, type SalesSeries } from '@/lib/sampleData';
import { mercatoTokens } from '@/lib/theme';

const ranges: { key: SalesRange; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.17;
    d += `C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)} ` +
      `${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)} ` +
      `${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function niceTop(max: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(max / 4)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    if (m * mag * 4 >= max * 1.04) return m * mag * 4;
  }
  return max;
}

/**
 * Trend-over-time panel (§5): segmented range control, current + dashed
 * previous-period line, hover tooltip with delta, legend below.
 * One deliberate motion moment: line draw-in on range change.
 */
export function SalesChart() {
  const [range, setRange] = useState<SalesRange>('daily');
  const [animate, setAnimate] = useState(true);
  const [hover, setHover] = useState<number>(-1);
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const d: SalesSeries = salesData[range];
  const summary = useMemo(() => summarise(d), [d]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !('ResizeObserver' in window)) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSize({ w: host.clientWidth, h: host.clientHeight || 300 });
        setAnimate(false);
      });
    });
    ro.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const pickRange = (r: SalesRange) => {
    setRange(r);
    setAnimate(true);
    setHover(-1);
  };

  const geom = useMemo(() => {
    const W = Math.max(300, size.w || 600);
    const H = Math.max(260, size.h || 300);
    const pad = { l: 54, r: 18, t: 14, b: 30 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const n = d.cur.length;
    const top = niceTop(Math.max(...d.cur, ...d.prev));
    const x = (i: number) => pad.l + (i * iw) / (n - 1);
    const y = (v: number) => pad.t + ih * (1 - v / top);
    const curPts = d.cur.map((v, i) => [x(i), y(v)] as [number, number]);
    const line = smooth(curPts);
    const area = `${line}L${x(n - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
    const grid: { v: number; y: number }[] = [];
    for (let t = 0; t <= 4; t++) {
      const v = (top / 4) * t;
      grid.push({ v, y: y(v) });
    }
    const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 66))));
    const ticks = d.labels.filter((_, i) => (n - 1 - i) % step === 0).map((lb) => {
      const i = d.labels.indexOf(lb);
      return { lb, x: x(i) };
    });
    return { W, H, pad, iw, ih, n, x, y, line, area, grid, ticks, prevLine: smooth(d.prev.map((v, i) => [x(i), y(v)] as [number, number])) };
  }, [d, size]);

  const onPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = (e.target as SVGRectElement).ownerSVGElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (geom.W / r.width);
    const i = Math.max(0, Math.min(geom.n - 1, Math.round(((mx - geom.pad.l) / geom.iw) * (geom.n - 1))));
    setHover(i);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHover((h) => Math.min(geom.n - 1, h + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHover((h) => Math.max(0, h < 0 ? geom.n - 1 : h - 1));
    } else if (e.key === 'Escape') {
      setHover(-1);
    }
  };

  const hoverDiff = hover >= 0 ? (d.cur[hover] / d.prev[hover] - 1) * 100 : 0;
  const tipLeft = hover >= 0 ? geom.x(hover) : 0;
  const tipStyle: React.CSSProperties =
    hover >= 0
      ? {
          opacity: 1,
          left: Math.max(0, Math.min(geom.W - 180, tipLeft > geom.W * 0.62 ? tipLeft - 196 : tipLeft + 16)),
        }
      : { opacity: 0 };

  return (
    <Paper component="section" aria-labelledby="sales-title" sx={{ display: 'flex', flexDirection: 'column', boxShadow: mercatoTokens.shadow2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h2" id="sales-title">
            Sales overview
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            Gross sales across all sellers · {d.sub}
          </Typography>
        </Box>
        <Box
          role="tablist"
          aria-label="Sales period"
          sx={{ display: 'inline-flex', p: 0.5, gap: 0.25, bgcolor: 'action.hover', border: 1, borderColor: 'divider', borderRadius: 3 }}
        >
          {ranges.map((r) => (
            <Box
              key={r.key}
              component="button"
              type="button"
              role="tab"
              aria-selected={range === r.key}
              onClick={() => pickRange(r.key)}
              sx={{
                px: 1.75,
                py: 0.875,
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: '0.84rem',
                color: range === r.key ? 'text.primary' : 'text.secondary',
                bgcolor: range === r.key ? 'background.paper' : 'transparent',
                boxShadow: range === r.key ? '0 1px 3px rgba(14, 42, 47, 0.14)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {r.label}
            </Box>
          ))}
        </Box>
      </Box>

      <Box aria-live="polite" sx={{ display: 'flex', flexWrap: 'wrap', gap: '14px 44px', my: 2.5 }}>
        {[
          { label: 'Gross sales', value: compact(summary.sales), delta: summary.dSales },
          { label: 'Orders', value: int(summary.orders), delta: summary.dOrders },
          { label: 'Average order value', value: `$${summary.aov.toFixed(2)}`, delta: summary.dAov },
        ].map((s) => (
          <Box key={s.label}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
              {s.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
                {s.value}
              </Typography>
              <Delta pct={s.delta} />
            </Box>
          </Box>
        ))}
      </Box>

      <Box ref={hostRef} sx={{ position: 'relative', flex: 1, minHeight: 300, mx: -0.75 }}>
        <Box
          component="svg"
          viewBox={`0 0 ${geom.W} ${geom.H}`}
          width={geom.W}
          height={geom.H}
          tabIndex={0}
          role="img"
          aria-label={`Sales chart, ${d.sub}. Use left and right arrow keys to read values.`}
          onKeyDown={onKeyDown}
          sx={{ position: 'absolute', inset: 0, display: 'block', overflow: 'visible', touchAction: 'pan-y' }}
        >
          <defs>
            <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: mercatoTokens.brand, stopOpacity: 0.3 }} />
              <stop offset="1" style={{ stopColor: mercatoTokens.brand, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <g>
            {geom.grid.map((g, i) => (
              <g key={i}>
                <line x1={geom.pad.l} x2={geom.W - geom.pad.r} y1={g.y} y2={g.y} stroke={mercatoTokens.line} strokeDasharray="3 5" />
                <text x={geom.pad.l - 12} y={g.y + 4} textAnchor="end" fill={mercatoTokens.faint} fontSize={11.5} fontWeight={500}>
                  {compact(g.v).replace('$0', '0')}
                </text>
              </g>
            ))}
            {geom.ticks.map((t, i) => (
              <text key={i} x={t.x} y={geom.H - 6} textAnchor="middle" fill={mercatoTokens.faint} fontSize={11.5} fontWeight={500}>
                {t.lb}
              </text>
            ))}
          </g>
          <path d={geom.prevLine} fill="none" stroke={mercatoTokens.faint} strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" opacity={0.9} />
          <path d={geom.area} fill="url(#gSales)" className={animate ? 'mercato-area-in' : undefined} />
          <path d={geom.line} fill="none" stroke={mercatoTokens.brand} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} className={animate ? 'mercato-line-draw' : undefined} />
          {hover >= 0 ? (
            <g>
              <line x1={geom.x(hover)} x2={geom.x(hover)} y1={geom.pad.t} y2={geom.y(0)} stroke={mercatoTokens.lineStrong} strokeWidth={1} />
              <circle cx={geom.x(hover)} cy={geom.y(d.cur[hover])} r={5.5} fill="#fff" stroke={mercatoTokens.brand} strokeWidth={3} />
            </g>
          ) : null}
          <rect
            x={geom.pad.l}
            y={geom.pad.t}
            width={geom.iw}
            height={geom.ih}
            fill="transparent"
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHover(-1)}
          />
        </Box>
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 8,
            left: 0,
            zIndex: 3,
            minWidth: 168,
            p: 1.5,
            bgcolor: mercatoTokens.text,
            color: '#fff',
            borderRadius: 4,
            boxShadow: mercatoTokens.shadow2,
            fontSize: '0.82rem',
            pointerEvents: 'none',
            transition: 'opacity 0.12s',
            ...tipStyle,
          }}
        >
          {hover >= 0 ? (
            <>
              <Box component="span" sx={{ display: 'block', color: 'rgba(255,255,255,0.66)', mb: 0.75, fontWeight: 500 }}>
                {d.full[hover]}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box component="span"><Box component="i" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', mr: 0.875, bgcolor: 'primary.main' }} />Sales</Box>
                <Box component="b" sx={{ fontWeight: 700 }}>{money(d.cur[hover])}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 0.375 }}>
                <Box component="span"><Box component="i" sx={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', mr: 0.875, bgcolor: 'text.disabled' }} />Previous</Box>
                <Box component="b" sx={{ fontWeight: 700 }}>{money(d.prev[hover])}</Box>
              </Box>
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.14)', color: hoverDiff < 0 ? '#ff9fbd' : '#7be3bf', fontWeight: 600 }}>
                {hoverDiff >= 0 ? '+' : '−'}{Math.abs(hoverDiff).toFixed(1)}% vs previous period
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', mt: 1.75, fontSize: '0.84rem', color: 'text.secondary' }}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Box component="i" sx={{ display: 'inline-block', width: 18, borderTop: `3px solid ${mercatoTokens.brand}`, borderRadius: 3 }} />This period
        </Box>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <Box component="i" sx={{ display: 'inline-block', width: 18, borderTop: `2px dotted ${mercatoTokens.faint}`, borderRadius: 3 }} />Previous period
        </Box>
      </Box>
    </Paper>
  );
}
