import * as React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@/lib/theme';
import { makeStore, type AppStore } from '@/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: AppStore;
}

/**
 * Secure test renderer:
 * - fresh Redux store per render (no auth/token bleed)
 * - real MUI theme (catches contrast / layout regressions)
 * - no network provider side-effects
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { store = makeStore(), ...options }: ExtendedRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
