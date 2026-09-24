'use client';

import { createTheme } from '@mui/material/styles';

/**
 * Aurora Admin design tokens — single source of truth.
 * Ported 1:1 from the reference UI (ui/files/styles.css).
 * Light-only system: lilac mist surfaces, ink indigo text, electric violet
 * brand. Semantic colours stay separate so "good" is never confused with
 * "brand". Fonts wired via next/font CSS vars (--font-display, --font-body).
 */
export const mercatoTokens = {
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
  good: '#0d7d5a',
  goodSoft: '#dcf5ea',
  accent: '#ff8a5b',
  accentStrong: '#b8471a',
  accentSoft: '#ffe8dd',
  bad: '#d6336c',
  badSoft: '#fde2ec',
  info: '#1f8fe0',
  infoSoft: '#dff0fd',
  shadow1: '0 1px 2px rgba(52, 36, 140, 0.05), 0 12px 30px -24px rgba(52, 36, 140, 0.35)',
  shadow2: '0 24px 50px -24px rgba(52, 36, 140, 0.35)',
  radius: { lg: 24, md: 16, sm: 12 },
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: { default: mercatoTokens.bg, paper: mercatoTokens.surface },
    text: {
      primary: mercatoTokens.text,
      secondary: mercatoTokens.muted,
      disabled: mercatoTokens.faint,
    },
    divider: mercatoTokens.line,
    primary: { main: mercatoTokens.brand, dark: mercatoTokens.brandStrong, light: mercatoTokens.brandSoft },
    success: { main: mercatoTokens.good, light: mercatoTokens.goodSoft },
    warning: { main: mercatoTokens.accentStrong, light: mercatoTokens.accentSoft },
    error: { main: mercatoTokens.bad, light: mercatoTokens.badSoft },
    info: { main: mercatoTokens.info, light: mercatoTokens.infoSoft },
  },
  shape: { borderRadius: mercatoTokens.radius.sm },
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
          border: `1px solid ${mercatoTokens.line}`,
          borderRadius: mercatoTokens.radius.lg,
          boxShadow: mercatoTokens.shadow1,
          padding: 24,
          '@media (max-width: 720px)': { padding: '20px 18px', borderRadius: 18 },
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
          borderRadius: mercatoTokens.radius.sm,
          textTransform: 'none',
          fontWeight: 600,
          minHeight: 44,
          [`&.MuiButton-containedPrimary`]: {
            boxShadow: '0 12px 22px -12px rgba(91, 61, 245, 0.8)',
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
            borderRadius: mercatoTokens.radius.sm,
            backgroundColor: theme.palette.background.paper,
            '& fieldset': { borderColor: theme.palette.divider },
            '&.Mui-focused fieldset': { borderColor: mercatoTokens.brand },
            '&.Mui-focused': { boxShadow: `0 0 0 4px ${mercatoTokens.brandSoft}` },
          },
        }),
      },
    },
  },
});
