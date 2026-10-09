import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/axios';
import { tokenManager } from '@/lib/tokenManager';

interface SellerAuthState {
  isAuthenticated: boolean;
  isInitialised: boolean;
  email: string | null;
}

const initialState: SellerAuthState = {
  isAuthenticated: false,
  isInitialised: false,
  email: null,
};

export const SELLER_SESSION_HINT_KEY = 'ecomm-seller-has-session';

function setCookieHint(): void {
  try {
    document.cookie = `${SELLER_SESSION_HINT_KEY}=1; Path=/; Max-Age=604800; SameSite=Lax`;
  } catch {}
}

function clearCookieHint(): void {
  try {
    document.cookie = `${SELLER_SESSION_HINT_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {}
}

export function hasSellerSessionHint(): boolean {
  try {
    return window.localStorage.getItem(SELLER_SESSION_HINT_KEY) === '1';
  } catch {
    return true;
  }
}

export function setSellerSessionHint(): void {
  try {
    window.localStorage.setItem(SELLER_SESSION_HINT_KEY, '1');
  } catch {}
  setCookieHint();
}

export function clearSellerSessionHint(): void {
  try {
    window.localStorage.removeItem(SELLER_SESSION_HINT_KEY);
  } catch {}
  clearCookieHint();
}

let sellerBootstrapPromise: Promise<{ accessToken: string; expiresInSeconds: number } | null> | null =
  null;

/** Silent refresh on load when the hint exists (single-flight). */
export const bootstrapSellerSession = createAsyncThunk(
  'sellerAuth/bootstrap',
  async (): Promise<{ accessToken: string; expiresInSeconds: number } | null> => {
    if (!sellerBootstrapPromise) {
      sellerBootstrapPromise = (async () => {
        try {
          const res = await apiClient.post('/seller/auth/refresh', {});
          return res.data.data as { accessToken: string; expiresInSeconds: number };
        } catch {
          return null;
        } finally {
          sellerBootstrapPromise = null;
        }
      })();
    }
    return sellerBootstrapPromise;
  },
);

export const sellerLogoutThunk = createAsyncThunk('sellerAuth/logout', async () => {
  try {
    await apiClient.post('/seller/auth/logout', {});
  } catch {}
  return true;
});

export const sellerLogoutAllThunk = createAsyncThunk('sellerAuth/logoutAll', async () => {
  try {
    await apiClient.post('/seller/auth/logout-all', {});
  } catch {}
  return true;
});

const sellerAuthSlice = createSlice({
  name: 'sellerAuth',
  initialState,
  reducers: {
    setSellerSession(
      state,
      action: { payload: { accessToken: string; expiresInSeconds: number; email?: string } },
    ) {
      state.isAuthenticated = true;
      state.isInitialised = true;
      if (action.payload.email) state.email = action.payload.email;
      tokenManager.setToken(action.payload.accessToken, action.payload.expiresInSeconds);
      setSellerSessionHint();
    },
    clearSellerAuth(state) {
      // NOTE: shares the in-memory token slot with admin auth (single
      // `tokenManager`). Signing out of one panel clears the shared slot —
      // acceptable: each panel re-bootstraps via its own refresh cookie.
      tokenManager.clear();
      clearSellerSessionHint();
      state.isAuthenticated = false;
      state.isInitialised = true;
      state.email = null;
    },
    markSellerInitialised(state) {
      state.isInitialised = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSellerSession.fulfilled, (state, action) => {
        state.isInitialised = true;
        if (action.payload) {
          state.isAuthenticated = true;
          tokenManager.setToken(action.payload.accessToken, action.payload.expiresInSeconds);
          setSellerSessionHint();
        } else {
          state.isAuthenticated = false;
          clearSellerSessionHint();
        }
      })
      .addCase(sellerLogoutThunk.fulfilled, (state) => {
        tokenManager.clear();
        clearSellerSessionHint();
        state.isAuthenticated = false;
        state.isInitialised = true;
        state.email = null;
      })
      .addCase(sellerLogoutAllThunk.fulfilled, (state) => {
        tokenManager.clear();
        clearSellerSessionHint();
        state.isAuthenticated = false;
        state.isInitialised = true;
        state.email = null;
      });
  },
});

export const { setSellerSession, clearSellerAuth, markSellerInitialised } = sellerAuthSlice.actions;
export default sellerAuthSlice.reducer;
