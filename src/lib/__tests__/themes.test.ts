import { mercatoTokens } from '@/lib/theme';
import {
  DEFAULT_MODE,
  DEFAULT_PRESET_ID,
  STORAGE_KEYS,
  THEME_PRESETS,
  activateTheme,
  effectiveColors,
  effectiveRadiusLg,
  effectiveShadowScale,
  getPreset,
  loadSavedTheme,
  mixHex,
  normalizeMode,
  resolveTokens,
  sanitizeCustom,
  validateImport,
} from '@/lib/themes';

const HEX = /^#[0-9a-fA-F]{6}$/;
const COLOR_KEYS = [
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
] as const;

describe('themes (preset engine, light + dark)', () => {
  afterEach(() => {
    window.localStorage.clear();
    activateTheme(DEFAULT_PRESET_ID, DEFAULT_MODE, null);
  });

  it('ships the default + 5 curated palettes, unique ids, valid hex in BOTH modes', () => {
    expect(THEME_PRESETS).toHaveLength(6);
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_PRESET_ID);
    for (const p of THEME_PRESETS) {
      expect(p.name).toBeTruthy();
      expect(p.vibe).toBeTruthy();
      expect(p.bestFor).toBeTruthy();
      for (const variant of [p.colors.light, p.colors.dark]) {
        for (const k of COLOR_KEYS) {
          expect(variant[k]).toMatch(HEX);
        }
      }
    }
  });

  it('defaults to the onyx preset in dark mode', () => {
    expect(DEFAULT_PRESET_ID).toBe('onyx');
    expect(DEFAULT_MODE).toBe('dark');
    expect(getPreset('onyx').name).toBe('Onyx Console');
    // dark canvases are near-black with light-gray text (reference look)
    expect(THEME_PRESETS[0].colors.dark.bg).toMatch(/^#1[0-9a-f]/);
    expect(parseInt(THEME_PRESETS[0].colors.dark.bg.slice(1, 3), 16)).toBeLessThan(64);
    expect(parseInt(THEME_PRESETS[0].colors.dark.text.slice(1, 3), 16)).toBeGreaterThan(180);
  });

  it('getPreset falls back to the default for unknown ids', () => {
    expect(getPreset('nope').id).toBe(THEME_PRESETS[0].id);
    expect(getPreset('emerald').name).toBe('Emerald');
  });

  it('normalizeMode accepts only light/dark and falls back to the default', () => {
    expect(normalizeMode('light')).toBe('light');
    expect(normalizeMode('dark')).toBe('dark');
    expect(normalizeMode('neon')).toBe(DEFAULT_MODE);
    expect(normalizeMode(null)).toBe(DEFAULT_MODE);
  });

  it('activateTheme applies live tokens and persists preset + mode', () => {
    activateTheme('emerald', 'dark', null);
    expect(mercatoTokens.brand).toBe('#2dd4a0');
    expect(mercatoTokens.good).toBe('#3dd68c');
    expect(mercatoTokens.bg).toBe('#141a17');
    expect(window.localStorage.getItem(STORAGE_KEYS.preset)).toBe('emerald');
    expect(window.localStorage.getItem(STORAGE_KEYS.mode)).toBe('dark');
    expect(loadSavedTheme()).toEqual({ presetId: 'emerald', mode: 'dark', custom: null });

    activateTheme('emerald', 'light', null);
    expect(mercatoTokens.brand).toBe('#059669');
    expect(mercatoTokens.good).toBe('#059669');
    expect(mercatoTokens.bg).toBe('#fafdf9');
  });

  it('custom overrides merge and auto-derive brand shades per mode', () => {
    activateTheme('blue', 'light', { brand: '#ff0000' });
    expect(mercatoTokens.brand).toBe('#ff0000');
    // light mode: soft = 12% brand + 88% white, strong = brand darkened 78%
    expect(mercatoTokens.brandSoft).toBe('#ffe0e0');
    expect(mercatoTokens.brandStrong).toBe('#c70000');

    activateTheme('blue', 'dark', { brand: '#ff0000' });
    // dark mode: soft leans near-black (tiny non-red channels), strong leans light
    expect(mercatoTokens.brandSoft).not.toBe('#ffe0e0');
    const soft = mercatoTokens.brandSoft;
    expect(parseInt(soft.slice(3, 5), 16)).toBeLessThanOrEqual(20);
    const strong = mercatoTokens.brandStrong;
    expect(parseInt(strong.slice(3, 5), 16)).toBeGreaterThan(100);
    expect(window.localStorage.getItem(STORAGE_KEYS.mode)).toBe('dark');

    activateTheme('blue', 'light', null);
    expect(mercatoTokens.brand).toBe('#2563eb');
    expect(window.localStorage.getItem(STORAGE_KEYS.custom)).toBeNull();
  });

  it('mixHex blends toward the second color', () => {
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#ffffff');
    expect(mixHex('#ff0000', '#ffffff', 0.5)).toBe('#ff8080');
  });

  it('effectiveColors mirrors the applied tokens without touching storage', () => {
    const eff = effectiveColors('rose', 'light', { text: '#111111' });
    expect(eff.brand).toBe('#e11d48');
    expect(eff.text).toBe('#111111');
    expect(window.localStorage.length).toBe(0);
  });

  it('status colors flip with mode: dark soft wells tint toward the canvas', () => {
    activateTheme('onyx', 'light', null);
    const lightGood = mercatoTokens.good;
    expect(lightGood).toBe('#059669');
    // light soft wells tint toward white
    expect(parseInt(mercatoTokens.badSoft.slice(1, 3), 16)).toBeGreaterThan(180);
    activateTheme('onyx', 'dark', null);
    expect(mercatoTokens.good).not.toBe(lightGood);
    // dark soft wells tint toward the near-black canvas
    expect(parseInt(mercatoTokens.badSoft.slice(1, 3), 16)).toBeLessThan(64);
  });

  it('status overrides recolor alerts on top of the shared sematics', () => {
    activateTheme('onyx', 'light', { bad: '#123456' });
    expect(mercatoTokens.bad).toBe('#123456');
    expect(mercatoTokens.good).toBe('#059669');
    activateTheme('onyx', 'dark', { bad: '#123456' });
    expect(mercatoTokens.bad).toBe('#123456');
    expect(mercatoTokens.good).toBe('#3dd68c');
  });

  it('explicit soft/strong shades win over auto-derivation', () => {
    activateTheme('blue', 'dark', { brand: '#ff0000', brandSoft: '#112233' });
    expect(mercatoTokens.brandSoft).toBe('#112233');
  });

  it('radius and shadow scales flow into resolved tokens; dark shadows stay subtle', () => {
    const round = resolveTokens('onyx', 'light', { radiusLg: 8 });
    expect(round.radius).toEqual({ lg: 8, md: 6, sm: 6 });
    const flat = resolveTokens('onyx', 'dark', { shadowScale: 0 });
    expect(flat.shadow1).toBe('none');
    expect(flat.shadow2).toBe('none');
    expect(effectiveRadiusLg({ radiusLg: 8 })).toBe(8);
    expect(effectiveRadiusLg(null)).toBe(12);
    expect(effectiveShadowScale(null)).toBe(1);
  });

  it('sanitizeCustom keeps status colors + shape, drops junk', () => {
    expect(
      sanitizeCustom({
        brand: '#FF0000',
        good: '#00ff00',
        radiusLg: 10.7,
        shadowScale: 1.6,
        nope: 'x',
        text: 'not-a-color',
        shadowScaleBad: 5,
      }),
    ).toEqual({ brand: '#ff0000', good: '#00ff00', radiusLg: 11, shadowScale: 1.6 });
    expect(sanitizeCustom(null)).toBeNull();
    expect(sanitizeCustom({ nope: 1 })).toBeNull();
    expect(sanitizeCustom({ shadowScale: 5 })).toBeNull();
  });

  it('loadSavedTheme sanitizes storage and normalizes junk modes', () => {
    activateTheme('onyx', 'dark', { bad: '#123456' });
    expect(mercatoTokens.bad).toBe('#123456');
    window.localStorage.setItem(STORAGE_KEYS.custom, '{"brand":"oops","radiusLg":99}');
    window.localStorage.setItem(STORAGE_KEYS.mode, 'plaid');
    // invalid hex dropped, radius clamped, mode normalized to default
    expect(loadSavedTheme().custom).toEqual({ radiusLg: 24 });
    expect(loadSavedTheme().mode).toBe(DEFAULT_MODE);
  });

  it('seeded resolved snapshot stays the pre-paint cache (mode + colors)', () => {
    activateTheme('indigo', 'light', null);
    const raw = window.localStorage.getItem(STORAGE_KEYS.resolved);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.m).toBe('light');
    expect(parsed.v.brand).toBe('#4f46e5');
  });

  it('validateImport rejects junk, accepts real exports with mode', () => {
    expect(validateImport(null)).toMatch(/not a theme file/i);
    expect(validateImport({ preset: 'nope' })).toMatch(/Unknown preset/);
    expect(validateImport({ preset: 'rose', mode: 'plaid' })).toMatch(/Unknown mode/i);
    expect(validateImport({ preset: 'rose', custom: { bad: 'zzz' } })).toMatch(
      /no usable values/i,
    );
    expect(validateImport({ preset: 'rose' })).toBeNull();
    expect(validateImport({ preset: 'rose', mode: 'dark', custom: { brand: '#123456' } })).toBeNull();
  });
});
