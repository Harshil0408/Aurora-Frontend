'use client';

import { useState } from 'react';
import { Alert, Box, Button } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { FormField, Modal, SegmentedFilter } from '@/components/ui/controls';
import { useRoleDetailQuery, useUpdateRoleStatusMutation } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeRoleDialog } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import { useResetKey } from '@/lib/utils';
import type { RoleStatus } from '@/types/rbac';

/** Screen 5 — activate / deactivate a role with a logged reason. Never for super_admin. */
export function RoleStatusModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activeRoleDialog) === 'status';
  const roleKey = useAppSelector((s) => s.rbac.dialogRoleKey);
  const { data } = useRoleDetailQuery(roleKey ?? '', { skip: !open || !roleKey });
  const role = data?.data ?? null;

  const [choice, setChoice] = useState<RoleStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerStatus, { isLoading }] = useUpdateRoleStatusMutation();

  // Sync the toggle when the role loads (fresh mount already resets the form).
  useResetKey(role ? `status:${role.key}:${role.status}` : null, () => {
    setChoice(role?.status ?? 'ACTIVE');
    setReason('');
    setReasonError(null);
    setFormError(null);
  });

  const close = () => dispatch(closeRoleDialog());
  const reasonValid = reason.trim().length >= 3 && reason.trim().length <= 500;
  const deactivating = role?.status === 'ACTIVE' && choice === 'INACTIVE';

  const submit = async () => {
    if (!role) return;
    if (!reasonValid) {
      setReasonError('3–500 characters — it is written to the audit entry.');
      return;
    }
    setReasonError(null);
    setFormError(null);
    try {
      await triggerStatus({ key: role.key, body: { status: choice, reason: reason.trim() } }).unwrap();
      close();
      notify(
        choice === 'INACTIVE'
          ? `${role.name} deactivated — holders lose those permissions immediately. Logged to Activity log.`
          : `${role.name} activated. Logged to Activity log.`,
      );
    } catch (err) {
      setFormError(normaliseApiError(err).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`${role?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} — ${role?.name ?? ''}`}
      subtitle="Takes effect the moment you confirm."
      icon={<PowerSettingsNewIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={choice === 'INACTIVE' ? 'error' : 'primary'}
            disabled={!reasonValid || isLoading || !role || choice === role.status}
            onClick={submit}
          >
            {isLoading ? 'Saving…' : 'Confirm change'}
          </Button>
        </>
      }
    >
      {deactivating ? (
        <Alert severity="warning">
          <b>Admins holding only this role lose those permissions immediately</b> (next request).
        </Alert>
      ) : null}
      <SegmentedFilter<RoleStatus>
        ariaLabel="Role status"
        value={choice}
        onChange={setChoice}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
        ]}
      />
      <FormField
        label={`Reason (logged to the audit entry, ${reason.trim().length}/500)`}
        multiline
        rows={2}
        placeholder="e.g. Consolidating support roles"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={reasonError != null}
        helperText={reasonError ?? undefined}
      />
      {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
    </Modal>
  );
}
