'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { buildAppTheme, type ThemeColors, type ThemeMode } from '@/lib/theme';
import {
  DEFAULT_MODE,
  DEFAULT_PRESET_ID,
  activateTheme,
  effectiveColors,
  getPreset,
  loadSavedTheme,
  normalizeMode,
  resolveTokens,
  validateImport,
  type ThemeCustom,
  type ThemePreset,
} from '@/lib/themes';
import { makeStore } from '@/store';

interface ThemeManager {
  preset: ThemePreset;
  mode: ThemeMode;
  custom: ThemeCustom | null;
  colors: ThemeColors;
  applyPreset: (id: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  updateCustom: (patch: ThemeCustom) => void;
  resetCustom: () => void;
  importTheme: (json: string) => string | null;
  exportTheme: () => string;
}

const ThemeManagerContext = createContext<ThemeManager | null>(null);

export function useThemeManager(): ThemeManager {
  const ctx = useContext(ThemeManagerContext);
  if (!ctx) throw new Error('useThemeManager must be used inside Providers');
  return ctx;
}

export function ThemeManagerProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe first paint: the server has no localStorage, so it always renders
  // the default preset + mode. The initial client render uses the same
  // defaults so Emotion generates identical classes during hydration. The
  // saved theme applies in the effect below, right after hydration. The
  // blocking boot script in layout.tsx already painted the matching CSS vars
  // + `dark` class pre-paint, so var()-based surfaces never flash.
  const [state, setState] = useState(() => {
    const preset = getPreset(DEFAULT_PRESET_ID);
    return { presetId: preset.id, mode: DEFAULT_MODE, custom: null as ThemeCustom | null };
  });

  useEffect(() => {
    // Subscribe to the saved theme (external system): cross-tab updates arrive
    // via `storage` events, and the one-time post-hydration sync below lets
    // the first client render match SSR (defaults) so Emotion classes hydrate
    // cleanly. The blocking boot script already painted the matching CSS vars
    // + `dark` class pre-paint, so var()-based surfaces never flash.
    const sync = () => {
      const saved = loadSavedTheme();
      const preset = activateTheme(saved.presetId, saved.mode, saved.custom);
      setState((prev) => {
        if (
          prev.presetId === preset.id &&
          prev.mode === saved.mode &&
          JSON.stringify(prev.custom ?? null) === JSON.stringify(saved.custom ?? null)
        ) {
          return prev;
        }
        return { presetId: preset.id, mode: saved.mode, custom: saved.custom };
      });
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const muiTheme = useMemo(
    () => buildAppTheme(resolveTokens(state.presetId, state.mode, state.custom), state.mode),
    [state],
  );

  const applyPreset = useCallback((id: string) => {
    const preset = activateTheme(id, state.mode, state.custom);
    setState((prev) => ({ ...prev, presetId: preset.id }));
  }, [state]);

  const setMode = useCallback(
    (mode: ThemeMode) => {
      const next = normalizeMode(mode);
      const preset = activateTheme(state.presetId, next, state.custom);
      setState({ presetId: preset.id, mode: next, custom: state.custom });
    },
    [state],
  );

  const toggleMode = useCallback(() => {
    setMode(state.mode === 'dark' ? 'light' : 'dark');
  }, [state, setMode]);

  const updateCustom = useCallback(
    (patch: ThemeCustom) => {
      const next = { ...state.custom, ...patch };
      activateTheme(state.presetId, state.mode, next);
      setState({ presetId: state.presetId, mode: state.mode, custom: next });
    },
    [state],
  );

  const resetCustom = useCallback(() => {
    const preset = activateTheme(state.presetId, state.mode, null);
    setState({ presetId: preset.id, mode: state.mode, custom: null });
  }, [state]);

  const importTheme = useCallback(
    (json: string): string | null => {
      let payload: unknown;
      try {
        payload = JSON.parse(json);
      } catch {
        return 'That text is not valid JSON — paste the exact export.';
      }
      const problem = validateImport(payload);
      if (problem) return problem;
      const { preset, mode, custom } = payload as {
        preset: string;
        mode?: ThemeMode | null;
        custom?: ThemeCustom | null;
      };
      const nextMode = normalizeMode(mode ?? state.mode);
      activateTheme(preset, nextMode, custom ?? null);
      setState({ presetId: preset, mode: nextMode, custom: custom ?? null });
      return null;
    },
    [state],
  );

  const exportTheme = useCallback((): string => {
    return JSON.stringify(
      { preset: state.presetId, mode: state.mode, custom: state.custom },
      null,
      2,
    );
  }, [state]);

  const value = useMemo<ThemeManager>(
    () => ({
      preset: getPreset(state.presetId),
      mode: state.mode,
      custom: state.custom,
      colors: effectiveColors(state.presetId, state.mode, state.custom),
      applyPreset,
      setMode,
      toggleMode,
      updateCustom,
      resetCustom,
      importTheme,
      exportTheme,
    }),
    [state, applyPreset, setMode, toggleMode, updateCustom, resetCustom, importTheme, exportTheme],
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ThemeManagerContext.Provider value={value}>{children}</ThemeManagerContext.Provider>
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  return (
    <Provider store={store}>
      <AppRouterCacheProvider>
        <ThemeManagerProvider>{children}</ThemeManagerProvider>
      </AppRouterCacheProvider>
    </Provider>
  );
}
