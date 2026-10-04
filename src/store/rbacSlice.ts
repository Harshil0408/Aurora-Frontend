import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type RoleDialogKind = 'create' | 'clone' | 'status' | 'delete' | 'editMeta';

interface RbacUiState {
  /** Role selected for the detail/matrix section (shared table → detail → modals). */
  selectedRoleKey: string | null;
  /** Role key the open dialog acts on (snapshot at open time). */
  dialogRoleKey: string | null;
  activeRoleDialog: RoleDialogKind | null;
}

const initialState: RbacUiState = {
  selectedRoleKey: null,
  dialogRoleKey: null,
  activeRoleDialog: null,
};

/**
 * Shared RBAC UI state — the roles table, detail matrix, and modals all read
 * the selection from here instead of prop-drilling role objects down the tree.
 * Server state stays in RTK Query; this slice holds UI state only.
 */
const rbacSlice = createSlice({
  name: 'rbac',
  initialState,
  reducers: {
    selectRole(state, action: PayloadAction<string | null>) {
      state.selectedRoleKey = action.payload;
    },
    openRoleDialog(
      state,
      action: PayloadAction<{ kind: RoleDialogKind; roleKey?: string | null }>,
    ) {
      state.activeRoleDialog = action.payload.kind;
      state.dialogRoleKey = action.payload.roleKey ?? state.selectedRoleKey;
    },
    closeRoleDialog(state) {
      state.activeRoleDialog = null;
      state.dialogRoleKey = null;
    },
  },
});

export const { selectRole, openRoleDialog, closeRoleDialog } = rbacSlice.actions;
export default rbacSlice.reducer;
