import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SellerSubscription } from '@/types/seller';

export interface ActiveSellerStore {
  storeId: string;
  name: string;
  slug: string;
  status: string;
  roleKey: string;
  permissions: string[];
  subscription: SellerSubscription | null;
}

interface SellerStoreState {
  active: ActiveSellerStore | null;
  switchError: 'forbidden' | 'unauthorized' | 'notfound' | null;
}

const initialState: SellerStoreState = { active: null, switchError: null };

const LAST_STORE_KEY = 'ecomm-seller-last-store';

export function getLastUsedStoreId(): string | null {
  try {
    return window.localStorage.getItem(LAST_STORE_KEY);
  } catch {
    return null;
  }
}

export function setLastUsedStoreId(storeId: string): void {
  try {
    window.localStorage.setItem(LAST_STORE_KEY, storeId);
  } catch {}
}

/** `can()` gating — UX only; the backend re-validates every request. */
export function hasSellerPermission(active: ActiveSellerStore | null, perm: string): boolean {
  return active?.permissions.includes(perm) ?? false;
}

const sellerStoreSlice = createSlice({
  name: 'sellerStore',
  initialState,
  reducers: {
    setActiveStore(state, action: PayloadAction<ActiveSellerStore>) {
      state.active = action.payload;
      state.switchError = null;
      setLastUsedStoreId(action.payload.storeId);
    },
    clearActiveStore(state) {
      state.active = null;
      state.switchError = null;
    },
    setSwitchError(state, action: PayloadAction<SellerStoreState['switchError']>) {
      state.switchError = action.payload;
    },
  },
});

export const { setActiveStore, clearActiveStore, setSwitchError } = sellerStoreSlice.actions;
export default sellerStoreSlice.reducer;
