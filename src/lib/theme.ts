'use client';

import { createTheme } from '@mui/material/styles';
import { AURORA_COLORS } from './themePresets';

export { AURORA_COLORS };

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
  good: '#047857',
  goodSoft: '#e9f7ef',
  accent: '#b45309',
  accentStrong: '#92400e',
  accentSoft: '#fef3c7',
  bad: '#be123c',
  badSoft: '#ffe4e6',
  info: '#0369a1',
  infoSoft: '#e0f2fe',
} as const;

const RADIUS = { lg: 16, md: 12, sm: 8 } as const;

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
  void brand;
  return {
    shadow1: `0 1px 2px rgba(16, 24, 40, ${0.05 * scale}), 0 12px 32px -16px rgba(16, 24, 40, ${0.18 * scale})`,
    shadow2: `0 24px 48px -20px rgba(16, 24, 40, ${0.25 * scale})`,
  };
}

export function radiusForLg(lg: number): { lg: number; md: number; sm: number } {
  const v = Math.min(24, Math.max(0, Math.round(lg)));
  return { lg: v, md: Math.max(6, v - 4), sm: Math.max(6, v - 8) };
}

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
  const motion = 'cubic-bezier(0.16, 1, 0.3, 1)';
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
      action: {
        hover: t.surface2,
        selected: t.brandSoft,
      },
    },
    shape: { borderRadius: t.radius.sm },
    typography: {
      fontFamily: 'var(--font-body), "Manrope", "Segoe UI", system-ui, sans-serif',
      h1: {
        fontFamily: 'var(--font-display), "Sora", "Segoe UI", system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '1.5rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h2: {
        fontFamily: 'var(--font-display), "Sora", "Segoe UI", system-ui, sans-serif',
        fontWeight: 700,
        fontSize: '1.05rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontFamily: 'var(--font-display), "Sora", "Segoe UI", system-ui, sans-serif',
        fontWeight: 600,
        fontSize: '0.95rem',
        letterSpacing: '-0.005em',
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
          body: { fontVariantNumeric: 'tabular-nums', WebkitFontSmoothing: 'antialiased' },
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
            padding: 20,
            transition: `border-color 200ms ${motion}, box-shadow 200ms ${motion}`,
            '@media (max-width: 720px)': { padding: '16px 14px', borderRadius: t.radius.lg },
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
            minHeight: 40,
            cursor: 'pointer',
            transition: `background-color 200ms ${motion}, border-color 200ms ${motion}, box-shadow 200ms ${motion}, transform 150ms ${motion}`,
            '&:active': { transform: 'scale(0.98)' },
            [`&.MuiButton-containedPrimary`]: {
              boxShadow:
                '0 1px 2px rgba(16, 24, 40, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            },
            [`&.MuiButton-containedPrimary:hover`]: {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(-1px)',
              boxShadow:
                '0 4px 12px -4px rgba(16, 24, 40, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            },
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: `background-color 200ms ${motion}, transform 150ms ${motion}`,
            '&:active': { transform: 'scale(0.96)' },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            transition: `background-color 200ms ${motion}, color 200ms ${motion}`,
          },
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
              transition: `box-shadow 200ms ${motion}, border-color 200ms ${motion}`,
              '& fieldset': { borderColor: theme.palette.divider },
              '&:hover fieldset': { borderColor: t.lineStrong },
              '&.Mui-focused fieldset': { borderColor: t.brand, borderWidth: 1 },
              '&.Mui-focused': { boxShadow: `0 0 0 3px ${t.brandSoft}` },
            },
          }),
        },
      },
    },
  });
}

export const theme = buildAppTheme();
