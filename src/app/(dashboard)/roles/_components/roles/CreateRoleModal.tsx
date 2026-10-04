'use client';

import { useState } from 'react';
import { Alert, Box, Button, Step, StepLabel, Stepper, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { FormField, Modal } from '@/components/ui/controls';
import { useCreateRoleMutation, usePermissionGroupsQuery } from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeRoleDialog } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import type { RbacErrorDetails } from '@/types/rbac';
import { detailsCode, useResetKey } from '@/lib/utils';
import { PermissionMatrix } from './PermissionMatrix';

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Create role — two steps (Details → Starting permissions).
 * The form always sends an explicit `permissionKeys` array (even `[]`):
 * omitting it would make the backend grant every ACTIVE permission, so an
 * unchecked picker means an empty role, never a surprise full grant.
 */
export function CreateRoleModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const open = useAppSelector((s) => s.rbac.activeRoleDialog) === 'create';
  const [step, setStep] = useState(0);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [unheld, setUnheld] = useState<string[]>([]);
  const [triggerCreate, { isLoading }] = useCreateRoleMutation();
  const { data: groupsRes, isLoading: groupsLoading } = usePermissionGroupsQuery(undefined, {
    skip: !open,
  });

  // Fresh form on every open (the shell stays mounted while the dialog closes).
  useResetKey(open ? 'create-open' : null, () => {
    setStep(0);
    setKey('');
    setName('');
    setDesc('');
    setPicked([]);
    setKeyError(null);
    setFormError(null);
    setRequestId(null);
    setUnheld([]);
  });

  const close = () => dispatch(closeRoleDialog());
  const keyValid = KEY_RE.test(key.trim()) && key.trim().length <= 64;
  const nameValid = name.trim().length >= 1 && name.trim().length <= 128;
  const descValid = desc.length <= 500;
  const detailsValid = keyValid && nameValid && descValid;

  const toggle = (permKey: string) =>
    setPicked((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey],
    );
  const toggleGroup = (keys: string[], select: boolean) =>
    setPicked((prev) =>
      select ? [...new Set([...prev, ...keys])] : prev.filter((k) => !keys.includes(k)),
    );

  const submit = async () => {
    setFormError(null);
    setRequestId(null);
    setUnheld([]);
    try {
      const res = await triggerCreate({
        key: key.trim(),
        name: name.trim(),
        description: desc.trim() || undefined,
        // Explicit least-privilege list — never omitted (omitted = all ACTIVE).
        permissionKeys: picked,
      }).unwrap();
      close();
      // Land on the new role's page, where the matrix is ready to trim or extend.
      router.push(`/roles/${res.data.key}`);
    } catch (err) {
      const norm = normaliseApiError(err);
      setRequestId(norm.requestId ?? null);
      if (norm.status === 409) {
        setStep(0);
        setKeyError(`Key "${key.trim()}" is already taken.`);
        return;
      }
      if (detailsCode(err) === 'CANNOT_GRANT_UNHELD_PERMISSION') {
        const held = (norm.details as RbacErrorDetails | null | undefined)?.unheld ?? [];
        setUnheld(Array.isArray(held) ? held.map(String) : []);
        setFormError(`${norm.message} Uncheck the highlighted rows or ask a Super Admin.`);
        return;
      }
      setFormError(norm.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create Role"
      subtitle="Starts with exactly what you pick — nothing else."
      icon={<AddIcon fontSize="small" />}
      maxWidth={step === 1 ? 'sm' : 'xs'}
      actions={
        step === 0 ? (
          <>
            <Button onClick={close}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" disabled={!detailsValid} onClick={() => setStep(1)}>
              Next: permissions
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep(0)}>Back</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={isLoading}
              onClick={() => void submit()}
            >
              {isLoading
                ? 'Creating…'
                : picked.length === 0
                  ? 'Create empty role'
                  : `Create with ${picked.length}`}
            </Button>
          </>
        )
      }
    >
      <Stepper activeStep={step} alternativeLabel sx={{ mt: 0.5 }}>
        <Step>
          <StepLabel>Details</StepLabel>
        </Step>
        <Step>
          <StepLabel>Starting permissions</StepLabel>
        </Step>
      </Stepper>

      {step === 0 ? (
        <>
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
        </>
      ) : (
        <>
          <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
            <b>{picked.length} selected.</b> Nothing checked means the role starts{' '}
            <b>empty</b> — you can grant more on the matrix right after. Disabled rows
            can&apos;t be granted at all.
          </Typography>
          <PermissionMatrix
            groups={groupsRes?.data}
            loading={groupsLoading}
            checked={picked}
            onToggle={toggle}
            onToggleGroup={toggleGroup}
            unheld={unheld}
          />
          {formError ? (
            <Alert severity="error" role="alert">
              {formError}
              {requestId ? (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  Reference: {requestId}
                </Typography>
              ) : null}
            </Alert>
          ) : null}
        </>
      )}
    </Modal>
  );
}
