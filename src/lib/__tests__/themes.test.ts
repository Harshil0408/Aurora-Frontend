import { mercatoTokens } from '@/lib/theme';
import {
  DEFAULT_PRESET_ID,
  THEME_PRESETS,
  activatePreset,
  effectiveColors,
  effectiveRadiusLg,
  effectiveShadowScale,
  getPreset,
  loadSavedTheme,
  mixHex,
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

describe('themes (preset engine)', () => {
  afterEach(() => {
    window.localStorage.clear();
    activatePreset(DEFAULT_PRESET_ID, null);
  });

  it('ships the default + 14 palettes, all valid hex, unique ids', () => {
    expect(THEME_PRESETS).toHaveLength(15);
    const ids = THEME_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_PRESET_ID);
    for (const p of THEME_PRESETS) {
      expect(p.name).toBeTruthy();
      expect(p.vibe).toBeTruthy();
      expect(p.bestFor).toBeTruthy();
      for (const k of COLOR_KEYS) {
        expect(p.colors[k]).toMatch(HEX);
      }
    }
  });

  it('getPreset falls back to the default for unknown ids', () => {
    expect(getPreset('nope').id).toBe(THEME_PRESETS[0].id);
    expect(getPreset('emerald').name).toBe('Emerald');
  });

  it('activatePreset applies live tokens and persists the choice', () => {
    activatePreset('emerald', null);
    expect(mercatoTokens.brand).toBe('#059669');
    expect(mercatoTokens.bg).toBe('#F8FAFC');
    expect(window.localStorage.getItem('aurora-theme-preset')).toBe('emerald');
    expect(loadSavedTheme()).toEqual({ presetId: 'emerald', custom: null });
  });

  it('custom overrides merge and auto-derive brand shades, then reset restores', () => {
    activatePreset('blue', { brand: '#ff0000' });
    expect(mercatoTokens.brand).toBe('#ff0000');
    // soft ≈ 12% brand + 88% white → very light red; strong ≈ darkened red
    expect(mercatoTokens.brandSoft).toMatch(HEX);
    expect(mercatoTokens.brandSoft).not.toBe('#EFF6FF');
    expect(mercatoTokens.bg).toBe('#F8FAFC');
    const saved = loadSavedTheme();
    expect(saved.presetId).toBe('blue');
    expect(saved.custom).toEqual({ brand: '#ff0000' });

    activatePreset('blue', null);
    expect(mercatoTokens.brand).toBe('#2563EB');
    expect(window.localStorage.getItem('aurora-theme-custom')).toBeNull();
  });

  it('mixHex blends toward the second color', () => {
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#ffffff');
    expect(mixHex('#ff0000', '#ffffff', 0.5)).toBe('#ff8080');
  });

  it('effectiveColors mirrors the applied tokens without touching storage', () => {
    const eff = effectiveColors('rose', { text: '#111111' });
    expect(eff.brand).toBe('#E11D48');
    expect(eff.text).toBe('#111111');
  });

  it('explicit soft/strong shades win over auto-derivation', () => {
    activatePreset('blue', { brand: '#ff0000', brandSoft: '#112233' });
    expect(mercatoTokens.brandSoft).toBe('#112233');
  });

  it('radius and shadow scales flow into resolved tokens', () => {
    const round = resolveTokens('aurora', { radiusLg: 8 });
    expect(round.radius).toEqual({ lg: 8, md: 5, sm: 4 });
    const flat = resolveTokens('aurora', { shadowScale: 0 });
    expect(flat.shadow1).toBe('none');
    expect(flat.shadow2).toBe('none');
    expect(effectiveRadiusLg({ radiusLg: 8 })).toBe(8);
    expect(effectiveRadiusLg(null)).toBe(4);
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

  it('status overrides recolor alerts, loadSavedTheme sanitizes storage', () => {
    activatePreset('aurora', { bad: '#123456' });
    expect(mercatoTokens.bad).toBe('#123456');
    expect(mercatoTokens.good).toBe('#0d7d5a');
    window.localStorage.setItem('aurora-theme-custom', '{"brand":"oops","radiusLg":99}');
    // invalid hex dropped, radius clamped
    expect(loadSavedTheme().custom).toEqual({ radiusLg: 28 });
  });

  it('validateImport rejects junk, accepts real exports', () => {
    expect(validateImport(null)).toMatch(/not a theme file/i);
    expect(validateImport({ preset: 'nope' })).toMatch(/Unknown preset/);
    expect(validateImport({ preset: 'rose', custom: { bad: 'zzz' } })).toMatch(
      /no usable values/i,
    );
    expect(validateImport({ preset: 'rose' })).toBeNull();
    expect(validateImport({ preset: 'rose', custom: { brand: '#123456' } })).toBeNull();
  });
});
