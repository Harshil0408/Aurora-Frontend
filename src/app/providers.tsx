'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { buildAppTheme, type ThemeColors } from '@/lib/theme';
import {
  activatePreset,
  effectiveColors,
  getPreset,
  loadSavedTheme,
  resolveTokens,
  validateImport,
  type ThemeCustom,
  type ThemePreset,
} from '@/lib/themes';
import { makeStore } from '@/store';

interface ThemeManager {
  preset: ThemePreset;
  custom: ThemeCustom | null;
  colors: ThemeColors;
  applyPreset: (id: string) => void;
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
  const [state, setState] = useState(() => {
    const saved = loadSavedTheme();
    const preset = activatePreset(saved.presetId, saved.custom);
    return { presetId: preset.id, custom: saved.custom };
  });

  const muiTheme = useMemo(
    () => buildAppTheme(resolveTokens(state.presetId, state.custom)),
    [state.presetId, state.custom],
  );

  const applyPreset = useCallback((id: string) => {
    const preset = activatePreset(id, null);
    setState({ presetId: preset.id, custom: null });
  }, []);

  const updateCustom = useCallback(
    (patch: ThemeCustom) => {
      const next = { ...state.custom, ...patch };
      activatePreset(state.presetId, next);
      setState({ presetId: state.presetId, custom: next });
    },
    [state],
  );

  const resetCustom = useCallback(() => {
    const preset = activatePreset(state.presetId, null);
    setState({ presetId: preset.id, custom: null });
  }, [state.presetId]);

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
      const { preset, custom } = payload as {
        preset: string;
        custom?: ThemeCustom | null;
      };
      activatePreset(preset, custom ?? null);
      setState({ presetId: preset, custom: custom ?? null });
      return null;
    },
    [],
  );

  const exportTheme = useCallback((): string => {
    return JSON.stringify({ preset: state.presetId, custom: state.custom }, null, 2);
  }, [state]);

  const value = useMemo<ThemeManager>(
    () => ({
      preset: getPreset(state.presetId),
      custom: state.custom,
      colors: effectiveColors(state.presetId, state.custom),
      applyPreset,
      updateCustom,
      resetCustom,
      importTheme,
      exportTheme,
    }),
    [state, applyPreset, updateCustom, resetCustom, importTheme, exportTheme],
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
