'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@/lib/theme';
import { makeStore } from '@/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  return (
    <Provider store={store}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </Provider>
  );
}
