import { makeStore } from '@/store';
import { closeRoleDialog, openRoleDialog, selectRole } from '@/store/rbacSlice';

describe('rbacSlice (shared RBAC UI state)', () => {
  it('selects and clears the role shared by table, detail, and dialogs', () => {
    const store = makeStore();
    expect(store.getState().rbac.selectedRoleKey).toBeNull();
    store.dispatch(selectRole('support'));
    expect(store.getState().rbac.selectedRoleKey).toBe('support');
    store.dispatch(selectRole(null));
    expect(store.getState().rbac.selectedRoleKey).toBeNull();
  });

  it('opens role dialogs with an explicit key, falling back to the selection', () => {
    const store = makeStore();
    store.dispatch(selectRole('support'));
    store.dispatch(openRoleDialog({ kind: 'clone' }));
    expect(store.getState().rbac.activeRoleDialog).toBe('clone');
    expect(store.getState().rbac.dialogRoleKey).toBe('support');
    store.dispatch(openRoleDialog({ kind: 'status', roleKey: 'finance' }));
    expect(store.getState().rbac.dialogRoleKey).toBe('finance');
    store.dispatch(closeRoleDialog());
    expect(store.getState().rbac.activeRoleDialog).toBeNull();
    expect(store.getState().rbac.dialogRoleKey).toBeNull();
    // Selection survives dialog close.
    expect(store.getState().rbac.selectedRoleKey).toBe('support');
  });
});
