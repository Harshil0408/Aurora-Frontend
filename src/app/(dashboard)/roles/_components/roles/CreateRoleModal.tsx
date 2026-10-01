'use client';

import { useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { FormField, Modal } from '@/components/ui/controls';
import { useCreateRoleMutation } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeRoleDialog, selectRole } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Screen 2 — create role. New roles start with zero permissions. */
export function CreateRoleModal({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.rbac.activeRoleDialog) === 'create';
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [triggerCreate, { isLoading }] = useCreateRoleMutation();

  // No reset effect: the dialog unmounts on close, so every open starts fresh.
  const close = () => dispatch(closeRoleDialog());
  const keyValid = KEY_RE.test(key.trim()) && key.trim().length <= 64;
  const nameValid = name.trim().length >= 1 && name.trim().length <= 128;
  const descValid = desc.length <= 500;

  const submit = async () => {
    if (!keyValid) {
      setKeyError('Use lowercase letters, numbers and single hyphens (max 64).');
      return;
    }
    setKeyError(null);
    setFormError(null);
    try {
      const res = await triggerCreate({
        key: key.trim(),
        name: name.trim(),
        description: desc.trim() || undefined,
      }).unwrap();
      close();
      dispatch(selectRole(res.data.key));
      notify(`Role ${res.data.name} created with zero permissions — assign them below. Logged to Activity log.`);
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
      title="Create Role"
      subtitle="Starts empty — you assign permissions right after."
      icon={<AddIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={close}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" disabled={!keyValid || !nameValid || !descValid || isLoading} onClick={submit}>
            {isLoading ? 'Creating…' : 'Create role'}
          </Button>
        </>
      }
    >
      <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
        Custom roles start with <b>zero permissions</b> — pick them in the matrix after creating.
      </Typography>
      <FormField
        label="Step 1 — Key (permanent slug)"
        value={key}
        onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
        placeholder="e.g. catalog-manager"
        error={keyError != null || (key !== '' && !keyValid)}
        helperText={keyError ?? 'Lowercase-hyphens, max 64. Can never be renamed.'}
      />
      <FormField
        label="Step 2 — Display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Catalog Manager"
        error={name !== '' && !nameValid}
        helperText={name !== '' && !nameValid ? '1–128 characters.' : undefined}
      />
      <FormField
        label={`Step 3 — Description (optional, ${desc.length}/500)`}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        multiline
        rows={2}
        placeholder="What is this role for?"
        error={!descValid}
        helperText={!descValid ? 'Max 500 characters.' : undefined}
      />
      {formError ? <Alert severity="error" role="alert">{formError}</Alert> : null}
    </Modal>
  );
}
