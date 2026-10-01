'use client';

import { useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FormField, Modal } from '@/components/ui/controls';
import { useCloneRoleMutation, useRoleDetailQuery } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeRoleDialog, selectRole } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import { useResetKey } from '@/lib/utils';

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Screen 4 — clone a role: new slug, copied grants, starts Active, never system. */
export function CloneRoleModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activeRoleDialog) === 'clone';
  const sourceKey = useAppSelector((s) => s.rbac.dialogRoleKey);
  const { data: sourceRes } = useRoleDetailQuery(sourceKey ?? '', { skip: !open || !sourceKey });
  const source = sourceRes?.data ?? null;

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerClone, { isLoading }] = useCloneRoleMutation();

  // Prefill when the source loads (fresh mount already resets the fields).
  useResetKey(source ? `clone:${source.key}:${source.updatedAt}` : null, () => {
    setKey('');
    setName(`${source?.name ?? ''} (copy)`);
    setDesc(source?.description ?? '');
    setKeyError(null);
    setFormError(null);
  });

  const close = () => dispatch(closeRoleDialog());
  const keyValid = KEY_RE.test(key.trim()) && key.trim().length <= 64;
  const nameValid = name.trim().length >= 1 && name.trim().length <= 128;
  const descValid = desc.length <= 500;

  const submit = async () => {
    if (!source) return;
    if (!keyValid) {
      setKeyError('Use lowercase letters, numbers and single hyphens (max 64).');
      return;
    }
    setKeyError(null);
    setFormError(null);
    try {
      const res = await triggerClone({
        sourceKey: source.key,
        body: { key: key.trim(), name: name.trim(), description: desc.trim() || undefined },
      }).unwrap();
      close();
      dispatch(selectRole(res.data.key));
      notify(`Role ${res.data.name} cloned from ${source.name}. Logged to Activity log.`);
      document.getElementById('role-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      const norm = normaliseApiError(err);
      if (norm.status === 409) setKeyError(`Key "${key.trim()}" is already taken.`);
      else setFormError(norm.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Clone — ${source?.name ?? ''}`}
      subtitle="A new role with the same grants, ready to diverge."
      icon={<ContentCopyIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!keyValid || !nameValid || !descValid || isLoading || !source} onClick={submit}>
            {isLoading ? 'Cloning…' : 'Clone role'}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
        Copies <b>{source?.permissions.length ?? 0} active permissions</b> from{' '}
        <b>{source?.name}</b>. Status starts Active. Never a system role.
      </Typography>
      <FormField
        label="New key (permanent slug)"
        value={key}
        onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        placeholder="e.g. catalog-manager-eu"
        error={keyError != null || (key !== '' && !keyValid)}
        helperText={keyError ?? 'Lowercase-hyphens, max 64. Can never be renamed.'}
      />
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
