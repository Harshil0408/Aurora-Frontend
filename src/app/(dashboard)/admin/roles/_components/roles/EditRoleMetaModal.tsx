'use client';

import { useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { FormField, Modal } from '@/components/ui/controls';
import { useRoleDetailQuery, useUpdateRoleMetaMutation } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeRoleDialog } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import { useResetKey } from '@/lib/utils';

/** Edit role name/description — the key is permanent and shown read-only. */
export function EditRoleMetaModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activeRoleDialog) === 'editMeta';
  const roleKey = useAppSelector((s) => s.rbac.dialogRoleKey);
  const { data } = useRoleDetailQuery(roleKey ?? '', { skip: !open || !roleKey });
  const role = data?.data ?? null;

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerUpdate, { isLoading }] = useUpdateRoleMetaMutation();

  // Prefill when the role loads (fresh mount already resets the fields).
  useResetKey(role ? `meta:${role.key}:${role.updatedAt}` : null, () => {
    setName(role?.name ?? '');
    setDesc(role?.description ?? '');
    setFormError(null);
  });

  const close = () => dispatch(closeRoleDialog());
  const nameValid = name.trim().length >= 1 && name.trim().length <= 128;
  const descValid = desc.length <= 500;

  const submit = async () => {
    if (!role) return;
    setFormError(null);
    try {
      await triggerUpdate({
        key: role.key,
        body: { name: name.trim(), description: desc.trim() || undefined },
      }).unwrap();
      close();
      notify(`Role renamed to ${name.trim()}. Logged to Activity log.`);
    } catch (err) {
      setFormError(normaliseApiError(err).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Edit role — ${role?.name ?? ''}`}
      subtitle="Only the display fields change. The key is permanent."
      icon={<EditIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!nameValid || !descValid || isLoading || !role} onClick={submit}>
            {isLoading ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
        Key (read-only):{' '}
        <Typography
          component="span"
          variant="caption"
          sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}
        >
          {role?.key}
        </Typography>
      </Typography>
      <FormField
        label="Display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={name !== '' && !nameValid}
        helperText={name !== '' && !nameValid ? '1–128 characters.' : undefined}
      />
      <FormField
        label={`Description (optional, ${desc.length}/500)`}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        rows={2}
        error={!descValid}
        helperText={!descValid ? 'Max 500 characters.' : undefined}
      />
      {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
    </Modal>
  );
}
