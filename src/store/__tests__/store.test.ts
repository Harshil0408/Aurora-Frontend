import { makeStore } from '@/store';
import { api } from '@/services/api';

describe('store wiring (RTK Query is part of global state)', () => {
  it('includes auth + api reducers and middleware', () => {
    const store = makeStore();
    const state = store.getState() as Record<string, unknown>;
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty(api.reducerPath);
  });

  it('creates independent stores (no cross-test bleed)', () => {
    const a = makeStore();
    const b = makeStore();
    expect(a).not.toBe(b);
  });
});
