'use client';

import {
  DEFAULT_RADIUS_LG,
  applyThemeTokens,
  radiusForLg,
  toTokens,
  type StatusColors,
  type ThemeColors,
  type ThemeTokens,
} from '@/lib/theme';
import {
  DEFAULT_PRESET_ID,
  RESOLVED_KEY,
  THEME_CSS_VARS,
  THEME_PRESETS,
  getPreset,
  type ThemePreset,
} from './themePresets';

export {
  DEFAULT_PRESET_ID,
  RESOLVED_KEY,
  THEME_CSS_VARS,
  THEME_PRESETS,
  getPreset,
} from './themePresets';
export type { ThemePreset } from './themePresets';

/* Preset data (table, ids, boot keys, CSS-var map) lives in ./themePresets.ts
   (server-safe, no 'use client') and is re-exported at the top of this file. */

const PRESET_KEY = 'aurora-theme-preset';
const CUSTOM_KEY = 'aurora-theme-custom';

type CssVarSource = Partial<Record<keyof typeof THEME_CSS_VARS, string>>;

/** Push theme colors into `:root` vars (body + loader paint from these pre-hydration). */
export function applyCssVars(colors: CssVarSource): void {
  try {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    (Object.keys(THEME_CSS_VARS) as Array<keyof typeof THEME_CSS_VARS>).forEach((k) => {
      const v = colors[k];
      if (typeof v === 'string') root.style.setProperty(THEME_CSS_VARS[k], v);
    });
    root.style.setProperty('color-scheme', 'light');
  } catch {
    /* non-DOM environment */
  }
}

export interface SavedTheme {
  presetId: string;
  custom: ThemeCustom | null;
}

/** Advanced overrides: any token + corner size + shadow intensity. */
export interface ThemeCustom extends Partial<ThemeColors>, Partial<StatusColors> {
  radiusLg?: number;
  shadowScale?: number;
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
  // Keep the pre-hydration CSS fallbacks (globals.css) in sync.
  applyCssVars(merged);
  writeStorage(PRESET_KEY, preset.id);
  writeStorage(CUSTOM_KEY, clean ? JSON.stringify(clean) : null);
  writeStorage(RESOLVED_KEY, JSON.stringify(merged));
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
    out.radiusLg = Math.min(24, Math.max(0, Math.round(raw.radiusLg)));
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
