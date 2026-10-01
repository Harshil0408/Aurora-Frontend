'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ConfirmDialog, FormField, Modal, SegmentedFilter } from '@/components/ui/controls';
import {
  useDefinePermissionMutation,
  useDeletePermissionMutation,
  useListPermissionsQuery,
  useUpdatePermissionMutation,
  useUpdatePermissionStatusMutation,
} from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closePermissionDialog } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import { machineCode, useResetKey } from '@/lib/utils';
import type { PermissionStatus } from '@/types/rbac';

const KEY_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

function useDialogPermission() {
  const key = useAppSelector((s) => s.rbac.dialogPermissionKey);
  const { data } = useListPermissionsQuery(undefined);
  const perm = (data?.data ?? []).find((p) => p.key === key) ?? null;
  return perm;
}

/** Define-new modal — the key is live immediately, no deploy needed. */
export function DefinePermissionModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activePermissionDialog) === 'define';
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerDefine, { isLoading }] = useDefinePermissionMutation();

  // No reset effect: the dialog unmounts on close, so every open starts fresh.
  const close = () => dispatch(closePermissionDialog());
  const keyValid = KEY_RE.test(key.trim()) && key.trim().length <= 128;

  const submit = async () => {
    if (!keyValid) {
      setKeyError('Format module.action, lowercase with underscores (e.g. inventory.adjust).');
      return;
    }
    setKeyError(null);
    setFormError(null);
    try {
      const res = await triggerDefine({
        key: key.trim(),
        label: label.trim() || undefined,
        description: desc.trim() || undefined,
      }).unwrap();
      close();
      notify(`Permission ${res.data.key} defined — assignable to roles now. Logged to Activity log.`);
    } catch (err) {
      const norm = normaliseApiError(err);
      if (norm.status === 409) setKeyError(`Key "${key.trim()}" already exists.`);
      else setFormError(norm.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Define Permission"
      subtitle="A new authorizable action for the whole console."
      icon={<AddIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!keyValid || isLoading} onClick={submit}>
            {isLoading ? 'Defining…' : 'Define permission'}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
        <b>Live immediately</b> — assignable to roles with no deploy.
      </Typography>
      <FormField
        label="Step 1 — Key (permanent)"
        value={key}
        onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
        placeholder="e.g. inventory.adjust"
        error={keyError != null || (key !== '' && !keyValid)}
        helperText={keyError ?? 'One dot, both sides lowercase (module.action), max 128.'}
      />
      <FormField
        label="Step 2 — Label (optional)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Adjust inventory"
      />
      <FormField
        label="Step 3 — Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        rows={2}
        placeholder="What does this allow?"
      />
      {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
    </Modal>
  );
}

/** Edit modal — label/description only; the key never changes. */
export function EditPermissionModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activePermissionDialog) === 'edit';
  const perm = useDialogPermission();
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerUpdate, { isLoading }] = useUpdatePermissionMutation();

  // Prefill when the permission loads (fresh mount already resets the form).
  useResetKey(perm ? `edit:${perm.key}:${perm.updatedAt}` : null, () => {
    setLabel(perm?.label ?? '');
    setDesc(perm?.description ?? '');
    setFormError(null);
  });

  const close = () => dispatch(closePermissionDialog());

  const submit = async () => {
    if (!perm) return;
    setFormError(null);
    try {
      await triggerUpdate({
        key: perm.key,
        body: { label: label.trim() || undefined, description: desc.trim() || undefined },
      }).unwrap();
      close();
      notify(`Permission ${perm.key} updated. Logged to Activity log.`);
    } catch (err) {
      setFormError(normaliseApiError(err).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Edit — ${perm?.key ?? ''}`}
      subtitle="Only the display fields change. The key is permanent."
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={isLoading || !perm} onClick={submit}>
            {isLoading ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
        Key (read-only):{' '}
        <Typography component="span" variant="caption" sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
          {perm?.key}
        </Typography>
      </Typography>
      <FormField label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <FormField
        label="Description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        rows={2}
      />
      {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
    </Modal>
  );
}

/** Disable / re-enable modal — disabling stops authorizing instantly. */
export function PermissionStatusModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activePermissionDialog) === 'status';
  const perm = useDialogPermission();
  const [choice, setChoice] = useState<PermissionStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerStatus, { isLoading }] = useUpdatePermissionStatusMutation();

  // Sync the toggle when the permission loads (fresh mount resets the rest).
  useResetKey(perm ? `permstatus:${perm.key}:${perm.status}` : null, () => {
    setChoice(perm?.status ?? 'ACTIVE');
    setReason('');
    setReasonError(null);
    setFormError(null);
  });

  const close = () => dispatch(closePermissionDialog());
  const reasonValid = reason.trim().length >= 3 && reason.trim().length <= 500;
  const disabling = perm?.status === 'ACTIVE' && choice === 'INACTIVE';

  const submit = async () => {
    if (!perm) return;
    if (!reasonValid) {
      setReasonError('3–500 characters — it is written to the audit entry.');
      return;
    }
    setReasonError(null);
    setFormError(null);
    try {
      await triggerStatus({ key: perm.key, body: { status: choice, reason: reason.trim() } }).unwrap();
      close();
      notify(
        choice === 'INACTIVE'
          ? `${perm.key} disabled — stops authorizing instantly for every holder. Logged to Activity log.`
          : `${perm.key} re-enabled. Logged to Activity log.`,
      );
    } catch (err) {
      setFormError(normaliseApiError(err).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`${perm?.status === 'ACTIVE' ? 'Disable' : 'Re-enable'} — ${perm?.key ?? ''}`}
      subtitle="Takes effect the moment you confirm."
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={choice === 'INACTIVE' ? 'error' : 'primary'}
            disabled={!reasonValid || isLoading || !perm || choice === perm.status}
            onClick={submit}
          >
            {isLoading ? 'Saving…' : 'Confirm change'}
          </Button>
        </>
      }
    >
      {disabling ? (
        <Alert severity="warning">
          <b>Stops authorizing instantly for every holder.</b> Roles granting it keep the grant
          listed, but it authorizes nothing until re-enabled.
        </Alert>
      ) : null}
      <SegmentedFilter<PermissionStatus>
        ariaLabel="Permission status"
        value={choice}
        onChange={setChoice}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Disabled' },
        ]}
      />
      <FormField
        label={`Reason (logged to the audit entry, ${reason.trim().length}/500)`}
        multiline
        rows={2}
        placeholder="e.g. Replaced by inventory.adjust_v2"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={reasonError != null}
        helperText={reasonError ?? undefined}
      />
      {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
    </Modal>
  );
}

/** Delete permission — system and granted permissions are protected. */
export function DeletePermissionDialog({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activePermissionDialog) === 'delete';
  const perm = useDialogPermission();
  const [error, setError] = useState<string | null>(null);
  const [triggerDelete, { isLoading }] = useDeletePermissionMutation();

  const close = () => {
    setError(null);
    dispatch(closePermissionDialog());
  };

  const confirm = async () => {
    if (!perm) return;
    setError(null);
    try {
      await triggerDelete(perm.key).unwrap();
      close();
      notify(`Permission ${perm.key} deleted. Logged to Activity log.`);
    } catch (err) {
      if (machineCode(err) === 'PERMISSION_GRANTED') {
        setError(
          `Still granted to ${perm.roleCount} role${perm.roleCount === 1 ? '' : 's'} — remove it from every role first.`,
        );
      } else if (machineCode(err) === 'SYSTEM_PERMISSION_IMMUTABLE') {
        setError('System permissions cannot be deleted — disable it instead.');
      } else {
        setError(normaliseApiError(err).message);
      }
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={close}
      onConfirm={() => void confirm()}
      loading={isLoading}
      error={error}
      title={`Delete permission — ${perm?.key ?? ''}?`}
      confirmWord={perm?.key ?? ''}
      confirmLabel="Delete permission"
      consequence={
        <>
          <b>{perm?.key}</b> disappears permanently. Type the key to prove it, then confirm.
        </>
      }
      description={
        <>
          Only ungranted, non-system permissions can go. Still granted somewhere? Open the{' '}
          <Link href="/roles">Roles screen</Link> and remove it from every role first.
        </>
      }
    />
  );
}
