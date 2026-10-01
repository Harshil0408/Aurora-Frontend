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

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'aurora',
    name: 'Aurora Violet',
    tagline: 'The out-of-box look — lilac mist, ink text, electric violet.',
    vibe: 'Premium · creative · signature',
    bestFor: 'Default for Aurora Admin',
    colors: { ...AURORA_COLORS },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    tagline: 'Premium SaaS blue-violet. The safest premium pick.',
    vibe: 'Premium · modern · trustworthy',
    bestFor: 'Admin panels, B2B SaaS, analytics',
    colors: {
      bg: '#FAFAF9',
      surface: '#FFFFFF',
      surface2: '#F5F5F4',
      line: '#E7E5E4',
      lineStrong: '#D6D3D1',
      text: '#18181B',
      muted: '#71717A',
      faint: '#A1A1AA',
      brand: '#4F46E5',
      brandStrong: '#4338CA',
      brandSoft: '#EEEDFE',
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
      muted: '#64748B',
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
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#F0FDF4',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#059669',
      brandStrong: '#047857',
      brandSoft: '#ECFDF5',
    },
  },
  {
    id: 'cyan',
    name: 'Cyan Tech',
    tagline: 'Energetic cyan for technical products.',
    vibe: 'Technical · modern · energetic',
    bestFor: 'Developer tools, AI SaaS, APIs, cloud',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#ECFEFF',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#0891B2',
      brandStrong: '#0E7490',
      brandSoft: '#E0F7FD',
    },
  },
  {
    id: 'violet',
    name: 'Creative Violet',
    tagline: 'Sophisticated violet with a futuristic edge.',
    vibe: 'Creative · sophisticated · futuristic',
    bestFor: 'AI products, design tools, marketing',
    colors: {
      bg: '#FAFAFF',
      surface: '#FFFFFF',
      surface2: '#F5F3FF',
      line: '#E5E7EB',
      lineStrong: '#D1D5DB',
      text: '#18181B',
      muted: '#71717A',
      faint: '#A1A1AA',
      brand: '#7C3AED',
      brandStrong: '#6D28D9',
      brandSoft: '#EFE9FE',
    },
  },
  {
    id: 'rose',
    name: 'Startup Rose',
    tagline: 'Bold rose for youthful products.',
    vibe: 'Bold · youthful · startup',
    bestFor: 'Consumer SaaS, communities, social',
    colors: {
      bg: '#FFFDFD',
      surface: '#FFFFFF',
      surface2: '#FFF1F2',
      line: '#E5E7EB',
      lineStrong: '#D1D5DB',
      text: '#18181B',
      muted: '#71717A',
      faint: '#A1A1AA',
      brand: '#E11D48',
      brandStrong: '#BE123C',
      brandSoft: '#FFE4E9',
    },
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    tagline: 'Approachable warm premium.',
    vibe: 'Warm · premium · approachable',
    bestFor: 'Finance, consulting, marketplaces',
    colors: {
      bg: '#FFFCF7',
      surface: '#FFFFFF',
      surface2: '#FFFBEB',
      line: '#E7E5E4',
      lineStrong: '#D6D3D1',
      text: '#1C1917',
      muted: '#78716C',
      faint: '#A8A29E',
      brand: '#D97706',
      brandStrong: '#B45309',
      brandSoft: '#FEF3DF',
    },
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
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#334155',
      brandStrong: '#1E293B',
      brandSoft: '#E8EDF3',
    },
  },
  {
    id: 'teal',
    name: 'Deep Teal',
    tagline: 'Calm teal for focused operations.',
    vibe: 'Calm · balanced · dependable',
    bestFor: 'Support desks, health ops, logistics',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#F0FDFA',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#0D9488',
      brandStrong: '#0F766E',
      brandSoft: '#DFF7F1',
    },
  },
  {
    id: 'sky',
    name: 'Airy Sky',
    tagline: 'Light, communicative sky blue.',
    vibe: 'Airy · friendly · open',
    bestFor: 'Collaboration, comms, education',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#F0F9FF',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#0284C7',
      brandStrong: '#0369A1',
      brandSoft: '#E0F2FE',
    },
  },
  {
    id: 'fuchsia',
    name: 'Bold Fuchsia',
    tagline: 'Expressive magenta for standout brands.',
    vibe: 'Expressive · bold · memorable',
    bestFor: 'Marketing, creator tools, events',
    colors: {
      bg: '#FDFCFD',
      surface: '#FFFFFF',
      surface2: '#FDF4FF',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#C026D3',
      brandStrong: '#A21CAF',
      brandSoft: '#F8E3FD',
    },
  },
  {
    id: 'orange',
    name: 'Vivid Orange',
    tagline: 'Energetic orange with warm neutrals.',
    vibe: 'Energetic · friendly · optimistic',
    bestFor: 'Marketplaces, food, logistics, retail',
    colors: {
      bg: '#FFFDF8',
      surface: '#FFFFFF',
      surface2: '#FFF7ED',
      line: '#E7E5E4',
      lineStrong: '#D6D3D1',
      text: '#1C1917',
      muted: '#78716C',
      faint: '#A8A29E',
      brand: '#EA580C',
      brandStrong: '#C2410C',
      brandSoft: '#FFE9D6',
    },
  },
  {
    id: 'lime',
    name: 'Fresh Lime',
    tagline: 'Zesty green for growth-stage teams.',
    vibe: 'Zesty · fresh · growth',
    bestFor: 'Startups, analytics, growth tools',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surface2: '#F7FEE7',
      line: '#E2E8F0',
      lineStrong: '#CBD5E1',
      text: '#0F172A',
      muted: '#64748B',
      faint: '#94A3B8',
      brand: '#65A30D',
      brandStrong: '#4D7C0F',
      brandSoft: '#E9F6CF',
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
      muted: '#64748B',
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
