import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "@/lib/axios";
import { tokenManager } from "@/lib/tokenManager";
import type { AuthStage, TwoFactorChannel } from "@/types/auth";

interface AuthState {
  accessToken: string | null;
  pendingToken: string | null;
  pendingExpiresAt: number | null;
  pendingChannel: TwoFactorChannel | null;
  stage: AuthStage;
  pendingEmail: string | null;
  isAuthenticated: boolean;
  isInitialised: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  pendingToken: null,
  pendingExpiresAt: null,
  pendingChannel: null,
  stage: "password",
  pendingEmail: null,
  isAuthenticated: false,
  isInitialised: false,
};

const SESSION_HINT_KEY = "ecomm-admin-has-session";

function setCookieHint(): void {
  try {
    // Mirror of the localStorage hint, visible to `middleware.ts`.
    // UX-only (client-writable); the backend re-authorizes every request.
    document.cookie = `${SESSION_HINT_KEY}=1; Path=/; Max-Age=86400; SameSite=Lax`;
  } catch {}
}

function clearCookieHint(): void {
  try {
    document.cookie = `${SESSION_HINT_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {}
}

export function hasSessionHint(): boolean {
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return true;
  }
}

function setSessionHint(): void {
  try {
    window.localStorage.setItem(SESSION_HINT_KEY, "1");
  } catch {}
  setCookieHint();
}

function clearSessionHint(): void {
  try {
    window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {}
  clearCookieHint();
}

let bootstrapPromise: Promise<{
  accessToken: string;
  expiresInSeconds: number;
} | null> | null = null;

export const bootstrapSession = createAsyncThunk(
  "auth/bootstrap",
  async (): Promise<{
    accessToken: string;
    expiresInSeconds: number;
  } | null> => {
    if (!bootstrapPromise) {
      bootstrapPromise = (async () => {
        try {
          const res = await apiClient.post("/admin/auth/refresh", {});
          return res.data.data as {
            accessToken: string;
            expiresInSeconds: number;
          };
        } catch {
          return null;
        } finally {
          bootstrapPromise = null;
        }
      })();
    }
    return bootstrapPromise;
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  try {
    await apiClient.post("/admin/auth/logout", {});
  } catch {}
  return true;
});

export const logoutAllThunk = createAsyncThunk("auth/logoutAll", async () => {
  try {
    await apiClient.post("/admin/auth/logout-all", {});
  } catch {}
  return true;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setPending(
      state,
      action: PayloadAction<{
        pendingToken: string;
        expiresInSeconds: number;
        email: string;
        channel: TwoFactorChannel;
      }>,
    ) {
      state.pendingToken = action.payload.pendingToken;
      state.pendingExpiresAt =
        Date.now() + action.payload.expiresInSeconds * 1000;
      state.pendingEmail = action.payload.email;
      state.pendingChannel = action.payload.channel;
      state.stage = "verify";
      state.isAuthenticated = false;
    },
    setSession(
      state,
      action: PayloadAction<{ accessToken: string; expiresInSeconds: number }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.pendingToken = null;
      state.pendingExpiresAt = null;
      state.pendingChannel = null;
      state.stage = "done";
      state.isAuthenticated = true;
      state.isInitialised = true;
      tokenManager.setToken(
        action.payload.accessToken,
        action.payload.expiresInSeconds,
      );
      setSessionHint();
    },
    setStage(state, action: PayloadAction<AuthStage>) {
      state.stage = action.payload;
    },
    resetLoginFlow(state) {
      state.pendingToken = null;
      state.pendingExpiresAt = null;
      state.pendingChannel = null;
      state.pendingEmail = null;
      state.stage = "password";
    },
    clearAuth(state) {
      tokenManager.clear();
      clearSessionHint();
      state.accessToken = null;
      state.pendingToken = null;
      state.pendingExpiresAt = null;
      state.pendingChannel = null;
      state.pendingEmail = null;
      state.stage = "password";
      state.isAuthenticated = false;
      state.isInitialised = true;
    },
    markInitialised(state) {
      state.isInitialised = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.isInitialised = true;
        if (action.payload) {
          state.accessToken = action.payload.accessToken;
          state.isAuthenticated = true;
          state.stage = "done";
          tokenManager.setToken(
            action.payload.accessToken,
            action.payload.expiresInSeconds,
          );
          setSessionHint();
        } else {
          state.isAuthenticated = false;
          clearSessionHint();
        }
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        tokenManager.clear();
        clearSessionHint();
        state.accessToken = null;
        state.pendingToken = null;
        state.pendingExpiresAt = null;
        state.pendingChannel = null;
        state.pendingEmail = null;
        state.stage = "password";
        state.isAuthenticated = false;
        state.isInitialised = true;
      })
      .addCase(logoutAllThunk.fulfilled, (state) => {
        tokenManager.clear();
        clearSessionHint();
        state.accessToken = null;
        state.pendingToken = null;
        state.pendingExpiresAt = null;
        state.pendingChannel = null;
        state.pendingEmail = null;
        state.stage = "password";
        state.isAuthenticated = false;
        state.isInitialised = true;
      });
  },
});

export const {
  setPending,
  setSession,
  setStage,
  resetLoginFlow,
  clearAuth,
  markInitialised,
} = authSlice.actions;
export default authSlice.reducer;
