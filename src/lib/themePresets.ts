import type { ThemeColors } from './theme';

/**
 * Theme preset data — deliberately a plain module with NO 'use client'
 * directive so the root layout (a server component) can import it to build
 * the blocking pre-paint boot script. The client-side engine in
 * `src/lib/themes.ts` imports from here and re-exports for compatibility,
 * so `@/lib/themes` stays the single import path for app code.
 */

export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  vibe: string;
  bestFor: string;
  colors: ThemeColors;
}

/** Out-of-box palette (also the compiled-CSS fallback in globals.css). */
export const AURORA_COLORS: ThemeColors = {
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
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'aurora',
    name: 'Studio Indigo',
    tagline: 'Stone canvas, ink text, one indigo accent — the premium console default.',
    vibe: 'Premium · minimal · trustworthy',
    bestFor: 'Admin consoles, B2B SaaS, operations dashboards',
    colors: { ...AURORA_COLORS },
  },
  {
    id: 'slate',
    name: 'Minimal Slate',
    tagline: 'Serious, Linear-like minimalism.',
    vibe: 'Minimal · serious · sophisticated',
    bestFor: 'Dev tools, enterprise SaaS, productivity',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#F1F5F9',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#475569',
      faint: '#94A3B8',
      brand: '#334155',
      brandStrong: '#1E293B',
      brandSoft: '#E8EDF3',
    },
  },
  {
    id: 'blue',
    name: 'Corporate Blue',
    tagline: 'Clean, familiar enterprise blue.',
    vibe: 'Professional · reliable · familiar',
    bestFor: 'CRM, ERP, fintech, business platforms',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#F1F5F9',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#475569',
      faint: '#94A3B8',
      brand: '#2563EB',
      brandStrong: '#1D4ED8',
      brandSoft: '#EFF6FF',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    tagline: 'Fresh green for productive teams.',
    vibe: 'Fresh · positive · productive',
    bestFor: 'Productivity, finance, health, project tools',
    colors: {
      bg: '#FAFAF9',
      surface: '#FFFFFF',
      surface2: '#F0FDF4',
      line: '#E7E5E4',
      lineStrong: '#D6D3D1',
      text: '#1C1917',
      muted: '#57534E',
      faint: '#A8A29E',
      brand: '#059669',
      brandStrong: '#047857',
      brandSoft: '#ECFDF5',
    },
  },
  {
    id: 'rose',
    name: 'Startup Rose',
    tagline: 'Bold rose for youthful products.',
    vibe: 'Bold · youthful · startup',
    bestFor: 'Consumer SaaS, communities, social',
    colors: {
      bg: '#FFFCFD',
      surface: '#FFFFFF',
      surface2: '#FFF1F2',
      line: '#E7E5E4',
      lineStrong: '#D6D3D1',
      text: '#1C1917',
      muted: '#57534E',
      faint: '#A8A29E',
      brand: '#E11D48',
      brandStrong: '#BE123C',
      brandSoft: '#FFE4E6',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    tagline: 'Deep navy for serious money matters.',
    vibe: 'Deep · prestigious · calm',
    bestFor: 'Banking, legal, insurance, enterprise',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#EEF2FF',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#475569',
      faint: '#94A3B8',
      brand: '#1E40AF',
      brandStrong: '#1E3A8A',
      brandSoft: '#E3EAF9',
    },
  },
];

export const DEFAULT_PRESET_ID = 'aurora';

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/**
 * Resolved-color snapshot for the pre-paint boot script in `layout.tsx`.
 * `aurora-theme-preset` + `aurora-theme-custom` stay the source of truth;
 * this is only a cache so the blocking inline script can restore exact
 * first-paint colors without embedding the whole preset table.
 */
export const RESOLVED_KEY = 'aurora-theme-resolved';

/** Theme colors mirrored to CSS vars so server HTML matches the saved theme. */
export const THEME_CSS_VARS = {
  bg: '--background',
  surface: '--surface',
  surface2: '--surface-2',
  line: '--line',
  text: '--foreground',
  muted: '--muted',
  brand: '--brand',
  brandStrong: '--brand-strong',
  brandSoft: '--brand-soft',
} as const;
