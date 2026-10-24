import type { ThemeColors } from './theme';

/**
 * Theme preset data — deliberately a plain module with NO 'use client'
 * directive so the root layout (a server component) can import it to build
 * the blocking pre-paint boot script. The client-side engine in
 * `src/lib/themes.ts` imports from here and re-exports for compatibility,
 * so `@/lib/themes` stays the single import path for app code.
 *
 * Every preset ships a light AND a dark palette; preset colors are derived
 * from the reference Onyx look: near-black warm canvas, hairline borders,
 * one saturated indigo-blue accent, light-gray text hierarchy.
 */

export interface PaletteSet {
  light: ThemeColors;
  dark: ThemeColors;
}

export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  vibe: string;
  bestFor: string;
  colors: PaletteSet;
}

/** Out-of-box preset (also the compiled-CSS fallback in globals.css). */
export const ONYX_COLORS: PaletteSet = {
  light: {
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
  dark: {
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
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'onyx',
    name: 'Onyx Console',
    tagline: 'Near-black canvas, hairline borders, one indigo-blue accent — the console default.',
    vibe: 'Compact · focused · engineering-grade',
    bestFor: 'Admin consoles, task tools, operations dashboards',
    colors: ONYX_COLORS,
  },
  {
    id: 'indigo',
    name: 'Studio Indigo',
    tagline: 'Stone canvas by day, deep ink by night.',
    vibe: 'Premium · minimal · trustworthy',
    bestFor: 'B2B SaaS, settings screens, profile surfaces',
    colors: {
      light: {
        bg: '#fafaf9',
        surface: '#ffffff',
        surface2: '#f4f4f5',
        line: '#e7e5e4',
        lineStrong: '#d6d3d1',
        text: '#1c1917',
        muted: '#57534e',
        faint: '#a8a29e',
        brand: '#4f46e5',
        brandStrong: '#4338ca',
        brandSoft: '#eeedfe',
      },
      dark: {
        bg: '#191a1f',
        surface: '#202129',
        surface2: '#282a35',
        line: '#30323e',
        lineStrong: '#3d3f4e',
        text: '#e4e4ea',
        muted: '#a0a2ae',
        faint: '#71727e',
        brand: '#6366f1',
        brandStrong: '#9a9dff',
        brandSoft: '#262843',
      },
    },
  },
  {
    id: 'slate',
    name: 'Minimal Slate',
    tagline: 'Serious, Linear-like minimalism in both modes.',
    vibe: 'Minimal · serious · sophisticated',
    bestFor: 'Dev tools, enterprise SaaS, productivity',
    colors: {
      light: {
        bg: '#f8fafc',
        surface: '#ffffff',
        surface2: '#f1f5f9',
        line: '#e2e8f0',
        lineStrong: '#cbd5e1',
        text: '#0f172a',
        muted: '#475569',
        faint: '#94a3b8',
        brand: '#334155',
        brandStrong: '#1e293b',
        brandSoft: '#e8edf3',
      },
      dark: {
        bg: '#15181d',
        surface: '#1b2028',
        surface2: '#232a34',
        line: '#2b333f',
        lineStrong: '#384250',
        text: '#e2e8f0',
        muted: '#94a3b8',
        faint: '#64748b',
        brand: '#94a3b8',
        brandStrong: '#c3cedb',
        brandSoft: '#252c36',
      },
    },
  },
  {
    id: 'blue',
    name: 'Corporate Blue',
    tagline: 'Clean, familiar enterprise blue, day or night.',
    vibe: 'Professional · reliable · familiar',
    bestFor: 'CRM, ERP, fintech, business platforms',
    colors: {
      light: {
        bg: '#f8fafc',
        surface: '#ffffff',
        surface2: '#f1f5f9',
        line: '#e2e8f0',
        lineStrong: '#cbd5e1',
        text: '#0f172a',
        muted: '#475569',
        faint: '#94a3b8',
        brand: '#2563eb',
        brandStrong: '#1d4ed8',
        brandSoft: '#eff6ff',
      },
      dark: {
        bg: '#141920',
        surface: '#1a2029',
        surface2: '#222a35',
        line: '#2a333f',
        lineStrong: '#37424f',
        text: '#e3e9f1',
        muted: '#9aa7b8',
        faint: '#66758a',
        brand: '#4c8dff',
        brandStrong: '#7dabff',
        brandSoft: '#1d2b45',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    tagline: 'Fresh green that stays calm on dark canvases.',
    vibe: 'Fresh · positive · productive',
    bestFor: 'Order ops, finance, health, project tools',
    colors: {
      light: {
        bg: '#fafdf9',
        surface: '#ffffff',
        surface2: '#f2f6f3',
        line: '#e4e9e5',
        lineStrong: '#d2dacd',
        text: '#17201a',
        muted: '#4f5c52',
        faint: '#95a29a',
        brand: '#059669',
        brandStrong: '#047857',
        brandSoft: '#e6f7ef',
      },
      dark: {
        bg: '#141a17',
        surface: '#1a221e',
        surface2: '#222d27',
        line: '#2a362f',
        lineStrong: '#37453c',
        text: '#e2eae5',
        muted: '#98a89f',
        faint: '#67766d',
        brand: '#2dd4a0',
        brandStrong: '#5fe3bb',
        brandSoft: '#16302a',
      },
    },
  },
  {
    id: 'rose',
    name: 'Startup Rose',
    tagline: 'Bold rose with a true night counterpart.',
    vibe: 'Bold · youthful · startup',
    bestFor: 'Consumer SaaS, communities, social',
    colors: {
      light: {
        bg: '#fffcfd',
        surface: '#ffffff',
        surface2: '#f9f2f4',
        line: '#eadfe3',
        lineStrong: '#dbccd2',
        text: '#1c1719',
        muted: '#5e4f55',
        faint: '#a5959b',
        brand: '#e11d48',
        brandStrong: '#be123c',
        brandSoft: '#ffe4e6',
      },
      dark: {
        bg: '#1a1417',
        surface: '#221a1e',
        surface2: '#2c2226',
        line: '#342a2e',
        lineStrong: '#43373d',
        text: '#eee4e8',
        muted: '#ada0a6',
        faint: '#786b71',
        brand: '#f43f6e',
        brandStrong: '#ff87a5',
        brandSoft: '#38121f',
      },
    },
  },
];

export const DEFAULT_PRESET_ID = 'onyx';

/** App-level default: the reference console boots in dark mode. */
export const DEFAULT_MODE: 'light' | 'dark' = 'dark';

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/**
 * Resolved-color snapshot for the pre-paint boot script in `layout.tsx`.
 * `aurora-theme-preset` + `aurora-theme-mode` + `aurora-theme-custom` stay
 * the source of truth; this is only a cache so the blocking inline script
 * can restore the exact first-paint colors (mode included) without
 * embedding the whole preset table.
 */
export const RESOLVED_KEY = 'aurora-theme-resolved';

/** Theme colors mirrored to CSS vars so server HTML matches the saved theme. */
export const THEME_CSS_VARS = {
  bg: '--background',
  surface: '--surface',
  surface2: '--surface-2',
  line: '--line',
  lineStrong: '--line-strong',
  text: '--foreground',
  muted: '--muted',
  faint: '--faint',
  brand: '--brand',
  brandStrong: '--brand-strong',
  brandSoft: '--brand-soft',
} as const;

// STORAGE_KEYS mirrors the localStorage keys the boot script in layout.tsx
// reads, so the two stay in lockstep.
export const STORAGE_KEYS = {
  preset: 'aurora-theme-preset',
  mode: 'aurora-theme-mode',
  custom: 'aurora-theme-custom',
  resolved: RESOLVED_KEY,
} as const;
