import reducer, {
  clearActiveStore,
  getLastUsedStoreId,
  hasSellerPermission,
  setActiveStore,
  setLastUsedStoreId,
  setSwitchError,
} from '@/store/sellerStoreSlice';
import sellerAuthReducer, { clearSellerAuth, markSellerInitialised } from '@/store/sellerAuthSlice';

const active = {
  storeId: 'store-1',
  name: 'Aurora Fashion',
  slug: 'aurora-fashion',
  status: 'ACTIVE',
  roleKey: 'owner',
  permissions: ['store:read', 'store:update', 'staff:invite'],
  subscription: null,
};

describe('sellerStoreSlice', () => {
  it('sets and clears the active store with switch errors', () => {
    let state = reducer(undefined, { type: '@@init' });
    expect(state.active).toBeNull();
    state = reducer(state, setActiveStore(active));
    expect(state.active?.storeId).toBe('store-1');
    expect(state.switchError).toBeNull();
    state = reducer(state, setSwitchError('forbidden'));
    expect(state.switchError).toBe('forbidden');
    state = reducer(state, clearActiveStore());
    expect(state.active).toBeNull();
    expect(state.switchError).toBeNull();
  });

  it('persists the last-used store as a plain preference', () => {
    setLastUsedStoreId('store-9');
    expect(getLastUsedStoreId()).toBe('store-9');
  });

  it('gates with can() over the permission set', () => {
    expect(hasSellerPermission(active, 'store:update')).toBe(true);
    expect(hasSellerPermission(active, 'billing:update')).toBe(false);
    expect(hasSellerPermission(null, 'store:read')).toBe(false);
  });
});

describe('sellerAuthSlice', () => {
  it('marks initialised without a session and clears auth', () => {
    let state = sellerAuthReducer(undefined, { type: '@@init' });
    expect(state.isInitialised).toBe(false);
    state = sellerAuthReducer(state, markSellerInitialised());
    expect(state.isInitialised).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    state = sellerAuthReducer(state, clearSellerAuth());
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialised).toBe(true);
  });
});
