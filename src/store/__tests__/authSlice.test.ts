import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  bootstrapSession,
  clearAuth,
  logoutAllThunk,
  logoutThunk,
  markInitialised,
  resetLoginFlow,
  setPending,
  setSession,
  setStage,
} from '@/store/authSlice';
import { tokenManager } from '@/lib/tokenManager';
import { apiClient } from '@/lib/axios';

jest.mock('@/lib/axios', () => ({
  apiClient: { post: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;

function makeTestStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

describe('authSlice (no session fixation, clean logout)', () => {
  beforeEach(() => {
    tokenManager.clear();
    mockedPost.mockReset();
  });

  it('setPending moves to verify stage without authenticating', () => {
    const store = makeTestStore();
    store.dispatch(
      setPending({ pendingToken: 'pt', expiresInSeconds: 300, email: 'a@b.co' }),
    );
    const s = store.getState().auth;
    expect(s.stage).toBe('verify');
    expect(s.pendingToken).toBe('pt');
    expect(s.isAuthenticated).toBe(false);
    expect(s.pendingExpiresAt).toBeGreaterThan(Date.now());
  });

  it('setSession authenticates, syncs tokenManager, and sets hint', () => {
    const store = makeTestStore();
    store.dispatch(setSession({ accessToken: 'at', expiresInSeconds: 300 }));
    const s = store.getState().auth;
    expect(s.isAuthenticated).toBe(true);
    expect(s.stage).toBe('done');
    expect(tokenManager.getToken()).toBe('at');
    expect(window.localStorage.getItem('ecomm-admin-has-session')).toBe('1');
  });

  it('clearAuth wipes tokens, hint, and flags (logout safety)', () => {
    const store = makeTestStore();
    store.dispatch(setSession({ accessToken: 'at', expiresInSeconds: 300 }));
    store.dispatch(clearAuth());
    const s = store.getState().auth;
    expect(s.accessToken).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.stage).toBe('password');
    expect(s.isInitialised).toBe(true);
    expect(tokenManager.getToken()).toBeNull();
    expect(window.localStorage.getItem('ecomm-admin-has-session')).toBeNull();
  });

  it('resetLoginFlow and setStage / markInitialised behave', () => {
    const store = makeTestStore();
    store.dispatch(
      setPending({ pendingToken: 'pt', expiresInSeconds: 60, email: 'a@b.co' }),
    );
    store.dispatch(resetLoginFlow());
    expect(store.getState().auth.stage).toBe('password');
    expect(store.getState().auth.pendingToken).toBeNull();
    store.dispatch(setStage('enroll'));
    expect(store.getState().auth.stage).toBe('enroll');
    store.dispatch(markInitialised());
    expect(store.getState().auth.isInitialised).toBe(true);
  });

  it('bootstrapSession success authenticates; failure stays logged out', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'fresh', expiresInSeconds: 300 } },
    });
    // bootstrapPromise is module-singleton: isolate via fresh store + sequential awaits
    const store = makeTestStore();
    await store.dispatch(bootstrapSession());
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(tokenManager.getToken()).toBe('fresh');

    mockedPost.mockRejectedValueOnce(new Error('no session'));
    const store2 = makeTestStore();
    tokenManager.clear();
    await store2.dispatch(bootstrapSession());
    expect(store2.getState().auth.isAuthenticated).toBe(false);
    expect(store2.getState().auth.isInitialised).toBe(true);
  });

  it('logout / logoutAll clear state even when API fails (never stuck)', async () => {
    mockedPost.mockRejectedValueOnce(new Error('network'));
    const store = makeTestStore();
    store.dispatch(setSession({ accessToken: 'at', expiresInSeconds: 300 }));
    await store.dispatch(logoutThunk());
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(tokenManager.getToken()).toBeNull();

    mockedPost.mockResolvedValueOnce({ data: {} });
    const store2 = makeTestStore();
    store2.dispatch(setSession({ accessToken: 'at', expiresInSeconds: 300 }));
    await store2.dispatch(logoutAllThunk());
    expect(store2.getState().auth.isAuthenticated).toBe(false);
  });
});
