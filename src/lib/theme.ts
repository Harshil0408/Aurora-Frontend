'use client';

import { createTheme } from '@mui/material/styles';

/**
 * Token engine — single source of truth for every color, radius and shadow
 * in the console. `mercatoTokens` is a mutable snapshot: the active theme
 * (preset + mode + custom overrides) is merged into it in place by
 * `src/lib/themes.ts`, and components read it at render time.
 *
 * Every palette ships BOTH a light and a dark variant; `mode` ships with the
 * tokens so the MUI theme (`buildAppTheme`) can switch `palette.mode` and
 * status colors keep their meaning on either canvas.
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  lineStrong: string;
  text: string;
  muted: string;
  faint: string;
  brand: string;
  brandStrong: string;
  brandSoft: string;
}

export interface StatusColors {
  good: string;
  goodSoft: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  bad: string;
  badSoft: string;
  info: string;
  infoSoft: string;
}

export interface ThemeTokens extends ThemeColors, StatusColors {
  shadow1: string;
  shadow2: string;
  radius: { lg: number; md: number; sm: number };
}

/**
 * Status colors are shared across presets (alerts keep their meaning
 * everywhere) but always ship a light and a dark variant — the soft `*Soft`
 * wells must be tinted toward the canvas color, never toward white, on a
 * dark background.
 */
const STATUS_LIGHT: StatusColors = {
  good: '#059669',
  goodSoft: '#e6f5ee',
  accent: '#b45309',
  accentStrong: '#92400e',
  accentSoft: '#fcf0dc',
  bad: '#e11d48',
  badSoft: '#fbe7ec',
  info: '#0284c7',
  infoSoft: '#e4f3fc',
} as const;

const STATUS_DARK: StatusColors = {
  good: '#3dd68c',
  goodSoft: '#12291d',
  accent: '#efb35c',
  accentStrong: '#f3c070',
  accentSoft: '#2b2113',
  bad: '#fb7185',
  badSoft: '#2e1219',
  info: '#4cb8ff',
  infoSoft: '#0e2334',
} as const;

export function statusColorsFor(mode: ThemeMode): StatusColors {
  return mode === 'dark' ? STATUS_DARK : STATUS_LIGHT;
}

const RADIUS = { lg: 12, md: 10, sm: 6 } as const;

export const DEFAULT_RADIUS_LG = RADIUS.lg;

export function radiusForLg(lg: number): { lg: number; md: number; sm: number } {
  const v = Math.min(24, Math.max(0, Math.round(lg)));
  return { lg: v, md: Math.max(6, v - 4), sm: Math.max(6, v - 8) };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexToRgba(hex: string, alpha: number): string {
  return rgba(hex, alpha);
}

/** Dark canvases need near-invisible shadows; hover color does the lifting. */
function shadowsFor(mode: ThemeMode, scale = 1): { shadow1: string; shadow2: string } {
  if (scale <= 0) return { shadow1: 'none', shadow2: 'none' };
  if (mode === 'dark') {
    return {
      shadow1: `0 1px 2px rgba(0, 0, 0, ${0.3 * scale}), 0 10px 28px -18px rgba(0, 0, 0, ${0.55 * scale})`,
      shadow2: `0 18px 40px -22px rgba(0, 0, 0, ${0.65 * scale})`,
    };
  }
  return {
    shadow1: `0 1px 2px rgba(16, 24, 40, ${0.05 * scale}), 0 12px 32px -16px rgba(16, 24, 40, ${0.18 * scale})`,
    shadow2: `0 24px 48px -20px rgba(16, 24, 40, ${0.25 * scale})`,
  };
}

export interface TokenOptions {
  mode?: ThemeMode;
  radiusLg?: number;
  shadowScale?: number;
}

export function toTokens(
  colors: ThemeColors & Partial<StatusColors>,
  opts: TokenOptions = {},
): ThemeTokens {
  const { mode = 'light' } = opts;
  const status = statusColorsFor(mode);
  (Object.keys(STATUS_LIGHT) as Array<keyof StatusColors>).forEach((k) => {
    const v = (colors as Partial<StatusColors>)[k];
    if (typeof v === 'string') status[k] = v;
  });
  return {
    ...(colors as ThemeColors),
    ...status,
    ...shadowsFor(mode, opts.shadowScale ?? 1),
    radius: radiusForLg(opts.radiusLg ?? RADIUS.lg),
  };
}

export const mercatoTokens: ThemeTokens = toTokens(
  {
    bg: '#17171a',
    surface: '#1e1e22',
    surface2: '#26262b',
    line: '#2d2d33',
    lineStrong: '#3a3a41',
    text: '#e3e3e6',
    muted: '#a0a0a8',
    faint: '#6f6f77',
    brand: '#5b7cfa',
    brandStrong: '#8ca3ff',
    brandSoft: '#242b45',
  },
  { mode: 'dark' },
);

/** `opts` carries the effective radius/shadow config, NOT color override. */
export function applyThemeTokens(
  colors: ThemeColors & Partial<StatusColors>,
  opts: TokenOptions = {},
): void {
  Object.assign(mercatoTokens, toTokens(colors, opts));
}

const MOTION = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const THEME_MOTION = MOTION;

export function buildAppTheme(
  t: ThemeTokens = mercatoTokens,
  mode: ThemeMode = 'light',
) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      background: { default: t.bg, paper: t.surface },
      text: {
        primary: t.text,
        secondary: t.muted,
        disabled: t.faint,
      },
      divider: t.line,
      primary: { main: t.brand, dark: t.brandStrong, light: t.brandSoft },
      success: { main: t.good, light: t.goodSoft },
      warning: { main: t.accentStrong, light: t.accentSoft },
      error: { main: t.bad, light: t.badSoft },
      info: { main: t.info, light: t.infoSoft },
      action: {
        hover: t.surface2,
        selected: t.brandSoft,
      },
    },
    shape: { borderRadius: t.radius.sm },
    typography: {
      fontFamily: 'var(--font-body), "Inter", "Segoe UI", system-ui, sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '1.25rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.25,
      },
      h2: {
        fontWeight: 700,
        fontSize: '0.95rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.35,
      },
      h3: {
        fontWeight: 600,
        fontSize: '0.88rem',
        letterSpacing: '0em',
        lineHeight: 1.4,
      },
      body1: { fontSize: '0.875rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      button: { fontWeight: 600, textTransform: 'none' as const },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontVariantNumeric: 'tabular-nums',
            WebkitFontSmoothing: 'antialiased',
          },
          'h1, h2, h3': { textWrap: 'balance' },
          p: { textWrap: 'pretty' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${t.line}`,
            borderRadius: t.radius.lg,
            boxShadow: t.shadow1,
            padding: 16,
            transition: `border-color 200ms ${MOTION}, box-shadow 200ms ${MOTION}, background-color 200ms ${MOTION}`,
            '@media (max-width: 720px)': { padding: '14px 12px', borderRadius: t.radius.lg },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { padding: '10px 12px' },
          sizeSmall: { padding: '8px 10px' },
          head: { fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { minHeight: 32, py: 0.75, fontSize: '0.82rem' },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { padding: 0 },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { padding: 0 },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { padding: 0 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: t.radius.sm,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.82rem',
            minHeight: 32,
            cursor: 'pointer',
            transition: `background-color 200ms ${MOTION}, border-color 200ms ${MOTION}, box-shadow 200ms ${MOTION}, transform 150ms ${MOTION}`,
            '&:active': { transform: 'scale(0.98)' },
            [`&.MuiButton-containedPrimary`]: {
              boxShadow: dark
                ? 'inset 0 1px 0 rgba(255, 255, 255, 0.12)'
                : '0 1px 2px rgba(16, 24, 40, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            },
            [`&.MuiButton-containedPrimary:hover`]: {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(-1px)',
            },
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: `background-color 200ms ${MOTION}, transform 150ms ${MOTION}`,
            '&:active': { transform: 'scale(0.96)' },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            transition: `background-color 200ms ${MOTION}, color 200ms ${MOTION}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 9999, fontWeight: 600, fontSize: '0.72rem' },
          sizeSmall: { height: 22 },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiOutlinedInput-root': {
              borderRadius: t.radius.sm,
              backgroundColor: theme.palette.background.paper,
              transition: `box-shadow 200ms ${MOTION}, border-color 200ms ${MOTION}`,
              '& fieldset': { borderColor: theme.palette.divider },
              '&:hover fieldset': { borderColor: t.lineStrong },
              '&.Mui-focused fieldset': { borderColor: t.brand, borderWidth: 1 },
              '&.Mui-focused': { boxShadow: dark ? 'none' : `0 0 0 3px ${t.brandSoft}` },
            },
          }),
        },
      },
    },
  });
}

/** Default light theme — used by `src/test-utils.tsx` (tests force light). */
export const theme = buildAppTheme(
  toTokens(
    {
      bg: '#f7f7f8',
      surface: '#ffffff',
      surface2: '#f1f1f3',
      line: '#e5e6ea',
      lineStrong: '#d4d5db',
      text: '#17181c',
      muted: '#5b5c63',
      faint: '#9a9ba3',
      brand: '#4c6ef5',
      brandStrong: '#3b5bdb',
      brandSoft: '#e8edfe',
    },
    { mode: 'light' },
  ),
  'light',
);
