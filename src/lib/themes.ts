'use client';

import {
  AURORA_COLORS,
  DEFAULT_RADIUS_LG,
  applyThemeTokens,
  radiusForLg,
  toTokens,
  type StatusColors,
  type ThemeColors,
  type ThemeTokens,
} from '@/lib/theme';

/**
 * Theme Manager presets — polished light-mode palettes for the console.
 * The active palette is applied live to `mercatoTokens` and persisted to
 * localStorage, so it survives reloads. 80–90% of surfaces stay neutral;
 * the brand color drives actions, active states, links, and focus rings.
 */

export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  vibe: string;
  bestFor: string;
  colors: ThemeColors;
}

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

const PRESET_KEY = 'aurora-theme-preset';
const CUSTOM_KEY = 'aurora-theme-custom';

export interface SavedTheme {
  presetId: string;
  custom: ThemeCustom | null;
}

/** Advanced overrides: any token + corner size + shadow intensity. */
export interface ThemeCustom extends Partial<ThemeColors>, Partial<StatusColors> {
  radiusLg?: number;
  shadowScale?: number;
}

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two hex colors; `weight` is the share of the first (0..1). */
export function mixHex(first: string, second: string, weight: number): string {
  const [r1, g1, b1] = hexToRgbTuple(first);
  const [r2, g2, b2] = hexToRgbTuple(second);
  return toHex(
    r1 * weight + r2 * (1 - weight),
    g1 * weight + g2 * (1 - weight),
    b1 * weight + b2 * (1 - weight),
  );
}

/** Merge preset + custom; a custom Brand auto-derives its soft/strong shades. */
function mergeColors(
  preset: ThemePreset,
  custom: ThemeCustom | null,
): ThemeColors & Partial<StatusColors> {
  const merged: ThemeColors = { ...preset.colors, ...custom };
  if (custom?.brand) {
    if (!custom.brandSoft) merged.brandSoft = mixHex(custom.brand, '#ffffff', 0.12);
    if (!custom.brandStrong) merged.brandStrong = mixHex(custom.brand, '#000000', 0.78);
  }
  return merged;
}

function readStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
}

export function loadSavedTheme(): SavedTheme {
  const presetId = readStorage(PRESET_KEY) ?? DEFAULT_PRESET_ID;
  let custom: ThemeCustom | null = null;
  try {
    const raw = readStorage(CUSTOM_KEY);
    if (raw) custom = sanitizeCustom(JSON.parse(raw)) ?? null;
  } catch {
    custom = null;
  }
  return { presetId: getPreset(presetId).id, custom };
}

/** Applies preset (+ optional custom overrides) live and persists. */
export function activatePreset(
  presetId: string,
  custom: ThemeCustom | null = null,
): ThemePreset {
  const preset = getPreset(presetId);
  const clean = custom ? sanitizeCustom(custom) : null;
  const merged = mergeColors(preset, clean);
  applyThemeTokens(merged, {
    radiusLg: clean?.radiusLg,
    shadowScale: clean?.shadowScale,
  });
  try {
    if (typeof document !== 'undefined') {
      // Keep the pre-hydration CSS fallbacks (globals.css) in sync.
      document.documentElement.style.setProperty('--background', merged.bg);
      document.documentElement.style.setProperty('--foreground', merged.text);
    }
  } catch {
    /* non-DOM environment */
  }
  writeStorage(PRESET_KEY, preset.id);
  writeStorage(CUSTOM_KEY, clean ? JSON.stringify(clean) : null);
  return preset;
}

export function effectiveColors(
  presetId: string,
  custom: ThemeCustom | null,
): ThemeColors {
  return mergeColors(getPreset(presetId), custom);
}

/** Full resolved tokens (colors + radius + shadows) for the MUI builder. */
export function resolveTokens(
  presetId: string,
  custom: ThemeCustom | null,
): ThemeTokens {
  const preset = getPreset(presetId);
  return toTokens(mergeColors(preset, custom), {
    radiusLg: custom?.radiusLg,
    shadowScale: custom?.shadowScale,
  });
}

export function effectiveRadiusLg(custom: ThemeCustom | null): number {
  return radiusForLg(custom?.radiusLg ?? DEFAULT_RADIUS_LG).lg;
}

export function effectiveShadowScale(custom: ThemeCustom | null): number {
  return custom?.shadowScale ?? 1;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const COLOR_KEYS: Array<keyof ThemeColors | keyof StatusColors> = [
  'bg',
  'surface',
  'surface2',
  'line',
  'lineStrong',
  'text',
  'muted',
  'faint',
  'brand',
  'brandStrong',
  'brandSoft',
  'good',
  'goodSoft',
  'accent',
  'accentStrong',
  'accentSoft',
  'bad',
  'badSoft',
  'info',
  'infoSoft',
];

/**
 * Keep only known, well-formed override fields. Returns null when nothing
 * usable remains — used for both storage reads and JSON imports.
 */
export function sanitizeCustom(value: unknown): ThemeCustom | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const out: ThemeCustom = {};
  for (const k of COLOR_KEYS) {
    const v = raw[k];
    if (typeof v === 'string' && HEX_COLOR.test(v)) {
      (out as Record<string, string>)[k] = v.toLowerCase();
    }
  }
  if (typeof raw.radiusLg === 'number' && Number.isFinite(raw.radiusLg)) {
    out.radiusLg = Math.min(28, Math.max(0, Math.round(raw.radiusLg)));
  }
  if (typeof raw.shadowScale === 'number' && [0, 1, 1.6].includes(raw.shadowScale)) {
    out.shadowScale = raw.shadowScale;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Validate an imported theme payload. Returns an error message or null. */
export function validateImport(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'That is not a theme file — paste the JSON you exported from here.';
  }
  const { preset, custom } = payload as Record<string, unknown>;
  if (typeof preset !== 'string' || !THEME_PRESETS.some((p) => p.id === preset)) {
    return `Unknown preset "${String(preset)}" — pick one of: ${THEME_PRESETS.map((p) => p.id).join(', ')}.`;
  }
  if (custom !== undefined && custom !== null && sanitizeCustom(custom) === null) {
    return 'The custom section has no usable values — check the hex colors (e.g. #4F46E5).';
  }
  return null;
}
