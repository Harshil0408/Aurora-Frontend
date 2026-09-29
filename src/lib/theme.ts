'use client';

import { createTheme } from '@mui/material/styles';

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

export interface ThemeTokens extends ThemeColors, StatusColors {
  shadow1: string;
  shadow2: string;
  radius: { lg: number; md: number; sm: number };
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

const SEMANTICS: StatusColors = {
  good: '#0d7d5a',
  goodSoft: '#dcf5ea',
  accent: '#ff8a5b',
  accentStrong: '#b8471a',
  accentSoft: '#ffe8dd',
  bad: '#d6336c',
  badSoft: '#fde2ec',
  info: '#1f8fe0',
  infoSoft: '#dff0fd',
} as const;

const RADIUS = { lg: 4, md: 3, sm: 2 } as const;

export const DEFAULT_RADIUS_LG = RADIUS.lg;

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

function shadowsFor(brand: string, scale = 1): { shadow1: string; shadow2: string } {
  if (scale <= 0) return { shadow1: 'none', shadow2: 'none' };
  return {
    shadow1: `0 1px 2px ${rgba(brand, 0.05 * scale)}, 0 12px 30px -24px ${rgba(brand, 0.35 * scale)}`,
    shadow2: `0 24px 50px -24px ${rgba(brand, 0.35 * scale)}`,
  };
}

export function radiusForLg(lg: number): { lg: number; md: number; sm: number } {
  const v = Math.min(28, Math.max(0, Math.round(lg)));
  return { lg: v, md: Math.round(v * 0.66), sm: Math.round(v * 0.5) };
}

export const AURORA_COLORS: ThemeColors = {
  bg: '#f2f0fb',
  surface: '#ffffff',
  surface2: '#f8f7fd',
  line: '#e6e3f3',
  lineStrong: '#d2cdea',
  text: '#1d1a3b',
  muted: '#68648a',
  faint: '#9a96b8',
  brand: '#5b3df5',
  brandStrong: '#4327d6',
  brandSoft: '#ece8ff',
};

export interface TokenOptions {
  radiusLg?: number;
  shadowScale?: number;
}

export function toTokens(
  colors: ThemeColors & Partial<StatusColors>,
  opts: TokenOptions = {},
): ThemeTokens {
  const { ...rest } = colors;
  const status: StatusColors = { ...SEMANTICS };
  (Object.keys(SEMANTICS) as Array<keyof StatusColors>).forEach((k) => {
    const v = (rest as Partial<StatusColors>)[k];
    if (typeof v === 'string') status[k] = v;
  });
  return {
    ...(rest as ThemeColors),
    ...status,
    ...shadowsFor(colors.brand, opts.shadowScale ?? 1),
    radius: radiusForLg(opts.radiusLg ?? RADIUS.lg),
  };
}

export const mercatoTokens: ThemeTokens = toTokens(AURORA_COLORS);

export function applyThemeTokens(
  colors: ThemeColors & Partial<StatusColors>,
  opts: TokenOptions = {},
): void {
  Object.assign(mercatoTokens, toTokens(colors, opts));
}

export function buildAppTheme(t: ThemeTokens = mercatoTokens) {
  return createTheme({
    palette: {
      mode: 'light',
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
    },
    shape: { borderRadius: t.radius.sm },
    typography: {
      fontFamily: 'var(--font-body), "Manrope", "Segoe UI", system-ui, sans-serif',
      h1: {
        fontFamily: 'var(--font-display), "Sora", "Segoe UI", system-ui, sans-serif',
        fontWeight: 600,
        fontSize: '2rem',
        letterSpacing: '-0.035em',
        lineHeight: 1.1,
      },
      h2: {
        fontFamily: 'var(--font-display), "Sora", "Segoe UI", system-ui, sans-serif',
        fontWeight: 600,
        fontSize: '1.2rem',
        letterSpacing: '-0.015em',
      },
      body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
      caption: { fontSize: '0.8rem' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontVariantNumeric: 'tabular-nums', WebkitFontSmoothing: 'antialiased' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${t.line}`,
            borderRadius: t.radius.lg,
            boxShadow: t.shadow1,
            padding: 24,
            '@media (max-width: 720px)': { padding: '20px 18px', borderRadius: t.radius.lg },
          },
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
            minHeight: 44,
            [`&.MuiButton-containedPrimary`]: {
              boxShadow: `0 12px 22px -12px ${rgba(t.brand, 0.8)}`,
            },
            [`&.MuiButton-containedPrimary:hover`]: {
              backgroundColor: theme.palette.primary.dark,
            },
          }),
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 9999, fontWeight: 600 } },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiOutlinedInput-root': {
              borderRadius: t.radius.sm,
              backgroundColor: theme.palette.background.paper,
              '& fieldset': { borderColor: theme.palette.divider },
              '&.Mui-focused fieldset': { borderColor: t.brand },
              '&.Mui-focused': { boxShadow: `0 0 0 4px ${t.brandSoft}` },
            },
          }),
        },
      },
    },
  });
}

export const theme = buildAppTheme();
