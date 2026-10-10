'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { ConfirmDialog, FormField, Modal } from '@/components/ui/controls';
import { DetailRow, GuideAccordion, HowRow } from '@/components/ui/Guide';
import { ButtonLoader } from '@/components/ui/Loaders';
import { normaliseApiError } from '@/types/api';
import type { Attribute, AttributeStatus } from '@/types/attributes';
import { slugifyAttributeKey } from '@/types/attributes';
import {
  attributeStatusSchema,
  createAttributeSchema,
  editAttributeSchema,
} from '@/lib/validations';
import {
  isAlreadyStatusError,
  isKeyConflict,
  useCreateAttributeMutation,
  useDeleteAttributeMutation,
  useSetAttributeStatusMutation,
  useUpdateAttributeMutation,
} from '@/services/attributesApi';
import { useResetKey } from '@/lib/utils';
import { prettyAttributeType } from '@/lib/variables';

export type AttributeToast = { kind: 'success' | 'error' | 'info'; text: string };

function parseMetadata(raw: string): { ok: true; value: Record<string, unknown> | undefined } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: undefined };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: 'Metadata must be a JSON object, e.g. {"code": "IN"}' };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: 'That is not valid JSON — check commas and quotes' };
  }
}

/* ------------------------------- Create ------------------------------- */

export function CreateAttributeModal({
  open,
  onClose,
  lockedType,
  existingTypes,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  /** Prefilled + locked when launched from a per-type screen. */
  lockedType?: string;
  existingTypes: string[];
  onToast: (t: AttributeToast) => void;
}) {
  const [create, { isLoading }] = useCreateAttributeMutation();
  const [type, setType] = useState(lockedType ?? '');
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [metadata, setMetadata] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useResetKey(open ? `create:${lockedType ?? ''}` : null, () => {
    setType(lockedType ?? '');
    setKey('');
    setLabel('');
    setValue('');
    setDescription('');
    setSortOrder('0');
    setMetadata('');
    setErrors({});
  });

  const submit = async () => {
    const parsed = createAttributeSchema.safeParse({
      type: lockedType ?? type,
      key,
      label,
      value,
      description,
      sortOrder: Number(sortOrder),
    });
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? 'form')] = issue.message;
    }
    if (sortOrder.trim() === '' || !Number.isInteger(Number(sortOrder))) {
      next.sortOrder = 'Enter a whole number between 0 and 1,000,000';
    }
    const meta = parseMetadata(metadata);
    if (!meta.ok) next.metadata = meta.error;
    setErrors(next);
    if (!parsed.success || !meta.ok || Object.keys(next).length > 0) return;

    try {
      const created = await create({
        type: parsed.data.type,
        key: parsed.data.key,
        label: parsed.data.label.trim(),
        ...(parsed.data.value ? { value: parsed.data.value } : {}),
        ...(parsed.data.description ? { description: parsed.data.description } : {}),
        sortOrder: parsed.data.sortOrder,
        ...(meta.value ? { metadata: meta.value } : {}),
      }).unwrap();
      onToast({ kind: 'success', text: `Created ${created.data.key} under ${created.data.type}` });
      onClose();
    } catch (err) {
      const norm = normaliseApiError(err);
      if (isKeyConflict(norm.status, norm.message)) {
        setErrors((e) => ({
          ...e,
          key: `This key already exists under type ${lockedType ?? type}. Keys are unique per type — try ${key}-2.`,
        }));
        return;
      }
      onToast({ kind: 'error', text: norm.message });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lockedType ? `Add ${prettyAttributeType(lockedType)}` : 'Add lookup entry'}
      subtitle="New entries start ACTIVE and are never system entries."
      icon={<AddIcon fontSize="small" />}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={submit} disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? <ButtonLoader label="Creating…" /> : 'Create entry'}
          </Button>
        </>
      }
    >
      {lockedType ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>Type</Typography>
          <Chip label={lockedType} size="small" color="primary" variant="outlined" />
        </Box>
      ) : (
        <>
          <FormField
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="payment_type"
            hint="Lowercase snake_case. Pick an existing type or invent a new one."
            error={Boolean(errors.type)}
            helperText={errors.type}
            slotProps={{ htmlInput: { list: 'attribute-type-list' } }}
          />
          <datalist id="attribute-type-list">
            {existingTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </>
      )}
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <FormField
          label="Display name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="United Payments"
          hint="What staff see in dropdowns."
          error={Boolean(errors.label)}
          helperText={errors.label}
        />
        <FormField
          label="Key (slug)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="united-payments"
          hint="Unique per type only — reuse across types is fine."
          error={Boolean(errors.key)}
          helperText={errors.key}
        />
      </Box>
      {label.trim() !== '' && key.trim() === '' ? (
        <Alert severity="info">
          Suggested key: <strong>{slugifyAttributeKey(label) || '—'}</strong>{' '}
          <Button size="small" onClick={() => setKey(slugifyAttributeKey(label))} sx={{ ml: 1, minHeight: 0 }}>
            Use it
          </Button>
        </Alert>
      ) : null}
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <FormField
          label="Code / value (optional)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="INR, +91, en-US"
          error={Boolean(errors.value)}
          helperText={errors.value}
        />
        <FormField
          label="Sort order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          hint="Lists sort by this, then name."
          error={Boolean(errors.sortOrder)}
          helperText={errors.sortOrder}
          slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }}
        />
      </Box>
      <FormField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        placeholder="Where this entry is used…"
        error={Boolean(errors.description)}
        helperText={errors.description}
      />
      <GuideAccordion title="Advanced — metadata (JSON object, optional)">
        <FormField
          label="Metadata JSON"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          multiline
          rows={3}
          placeholder='{"code": "IN"}'
          hint="Free-form payload for developers. Leave empty for simple lookups."
          error={Boolean(errors.metadata)}
          helperText={errors.metadata}
        />
      </GuideAccordion>
    </Modal>
  );
}

/* -------------------------------- Edit -------------------------------- */

export function EditAttributeModal({
  open,
  onClose,
  attribute,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  attribute: Attribute | null;
  onToast: (t: AttributeToast) => void;
}) {
  const [update, { isLoading }] = useUpdateAttributeMutation();
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [metadata, setMetadata] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useResetKey(attribute && open ? attribute.id : null, () => {
    setLabel(attribute?.label ?? '');
    setValue(attribute?.value ?? '');
    setDescription(attribute?.description ?? '');
    setSortOrder(String(attribute?.sortOrder ?? 0));
    setMetadata(attribute?.metadata ? JSON.stringify(attribute.metadata, null, 2) : '');
    setErrors({});
  });

  if (attribute == null) return null;

  const submit = async () => {
    const parsed = editAttributeSchema.safeParse({
      label,
      value,
      description,
      sortOrder: Number(sortOrder),
    });
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? 'form')] = issue.message;
    }
    if (sortOrder.trim() === '' || !Number.isInteger(Number(sortOrder))) {
      next.sortOrder = 'Enter a whole number between 0 and 1,000,000';
    }
    const meta = parseMetadata(metadata);
    if (!meta.ok) next.metadata = meta.error;
    setErrors(next);
    if (!parsed.success || !meta.ok || Object.keys(next).length > 0) return;

    try {
      // Empty optional fields send `null` (clears them); omit nothing.
      await update({
        id: attribute.id,
        label: parsed.data.label.trim(),
        value: parsed.data.value ? parsed.data.value : null,
        description: parsed.data.description ? parsed.data.description : null,
        metadata: meta.value ?? null,
        sortOrder: parsed.data.sortOrder,
      }).unwrap();
      onToast({ kind: 'success', text: `Saved ${attribute.key}` });
      onClose();
    } catch (err) {
      onToast({ kind: 'error', text: normaliseApiError(err).message });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${attribute.label}`}
      subtitle="Type and key are permanent — they identify the entry everywhere."
      icon={<EditIcon fontSize="small" />}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={submit} disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? <ButtonLoader label="Saving…" /> : 'Save changes'}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <Chip label={`type: ${attribute.type}`} size="small" variant="outlined" />
        <Chip label={`key: ${attribute.key}`} size="small" variant="outlined" />
        {attribute.isSystem ? <Chip label="system" size="small" color="info" /> : null}
      </Box>
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <FormField
          label="Display name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={Boolean(errors.label)}
          helperText={errors.label}
        />
        <FormField
          label="Sort order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          error={Boolean(errors.sortOrder)}
          helperText={errors.sortOrder}
          slotProps={{ htmlInput: { min: 0, max: 1000000, step: 1 } }}
        />
      </Box>
      <FormField
        label="Code / value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint="Leave empty to clear the code."
        error={Boolean(errors.value)}
        helperText={errors.value}
      />
      <FormField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        multiline
        rows={2}
        hint="Leave empty to clear the description."
        error={Boolean(errors.description)}
        helperText={errors.description}
      />
      <GuideAccordion title="Advanced — metadata (JSON object, optional)">
        <FormField
          label="Metadata JSON"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          multiline
          rows={3}
          hint="Empty clears the stored object."
          error={Boolean(errors.metadata)}
          helperText={errors.metadata}
        />
        {attribute.metadata ? (
          <Button size="small" onClick={() => setMetadata('')} sx={{ alignSelf: 'flex-start', minHeight: 0 }}>
            Clear stored metadata
          </Button>
        ) : null}
      </GuideAccordion>
    </Modal>
  );
}

/* ------------------------------- Status ------------------------------- */

export function StatusAttributeModal({
  open,
  onClose,
  attribute,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  attribute: Attribute | null;
  onToast: (t: AttributeToast) => void;
}) {
  const [setStatus, { isLoading }] = useSetAttributeStatusMutation();
  const [status, setStatusValue] = useState<AttributeStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useResetKey(attribute && open ? attribute.id : null, () => {
    setStatusValue(attribute?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setReason('');
    setError(null);
  });

  if (attribute == null) return null;
  const deactivating = status === 'INACTIVE';

  const submit = async () => {
    const parsed = attributeStatusSchema.safeParse({ status, reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form');
      return;
    }
    try {
      await setStatus({ id: attribute.id, status, reason: reason.trim() }).unwrap();
      onToast({
        kind: 'success',
        text: `${attribute.label} is now ${status === 'ACTIVE' ? 'active' : 'inactive'}`,
      });
      onClose();
    } catch (err) {
      const norm = normaliseApiError(err);
      if (isAlreadyStatusError(norm.message)) {
        // Someone else already toggled it — the list refetch shows the truth.
        onToast({ kind: 'info', text: `${attribute.label} is already ${norm.message.includes('INACTIVE') ? 'inactive' : 'active'} — list refreshed` });
        onClose();
        return;
      }
      setError(norm.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={deactivating ? `Deactivate ${attribute.label}` : `Activate ${attribute.label}`}
      subtitle="Inactive entries stay listed but disappear from live dropdowns."
      icon={<PowerSettingsNewIcon fontSize="small" />}
      maxWidth="xs"
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={deactivating ? 'warning' : 'primary'}
            onClick={submit}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? <ButtonLoader label="Saving…" /> : deactivating ? 'Deactivate' : 'Activate'}
          </Button>
        </>
      }
    >
      <FormControl component="fieldset">
        <FormLabel component="legend" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
          New status
        </FormLabel>
        <RadioGroup
          row
          value={status}
          onChange={(e) => setStatusValue(e.target.value as AttributeStatus)}
          aria-label="New status"
        >
          <FormControlLabel value="ACTIVE" control={<Radio size="small" />} label="Active" />
          <FormControlLabel value="INACTIVE" control={<Radio size="small" />} label="Inactive" />
        </RadioGroup>
      </FormControl>
      <FormField
        label="Reason (goes into the audit trail)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        multiline
        rows={2}
        placeholder="e.g. UPI sunset for this region"
        hint="Minimum 3 characters — future you will thank present you."
        error={Boolean(error)}
        helperText={error ?? undefined}
      />
      <GuideAccordion title="What happens on toggle?">
        <HowRow n={1}>Active entries appear in platform dropdowns; inactive ones are hidden but kept.</HowRow>
        <HowRow n={2}>Your reason is written to the audit log with your name and timestamp.</HowRow>
        <HowRow n={3}>Nothing is deleted — flip the status back any time to restore it.</HowRow>
      </GuideAccordion>
    </Modal>
  );
}

/* ------------------------------- Delete ------------------------------- */

export function DeleteAttributeDialog({
  open,
  onClose,
  attribute,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  attribute: Attribute | null;
  onToast: (t: AttributeToast) => void;
}) {
  const [remove, { isLoading }] = useDeleteAttributeMutation();
  const [error, setError] = useState<string | null>(null);

  useResetKey(attribute && open ? attribute.id : null, () => setError(null));
  if (attribute == null) return null;

  const confirm = async () => {
    try {
      await remove(attribute.id).unwrap();
      onToast({ kind: 'success', text: `Deleted ${attribute.type} / ${attribute.key}` });
      onClose();
    } catch (err) {
      const norm = normaliseApiError(err);
      if (norm.status === 403) {
        onToast({ kind: 'info', text: 'System entries cannot be deleted — nothing changed' });
        onClose();
        return;
      }
      if (norm.status === 404) {
        onToast({ kind: 'info', text: 'That entry was already deleted — list refreshed' });
        onClose();
        return;
      }
      setError(norm.message);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={confirm}
      title={`Delete ${attribute.label}?`}
      subtitle={`${attribute.type} / ${attribute.key}`}
      consequence="The entry is removed from every dropdown and validation that uses it. This cannot be undone."
      description={
        <>
          <DetailRow label="Entry">
            <Typography sx={{ fontSize: '0.86rem', fontWeight: 700 }}>
              {attribute.label} <Typography component="span" color="text.secondary">({attribute.key})</Typography>
            </Typography>
          </DetailRow>
          <DetailRow label="Used in">
            <Typography sx={{ fontSize: '0.86rem' }} color="text.secondary">
              Any form bound to the <strong>{attribute.type}</strong> lookup.
            </Typography>
          </DetailRow>
        </>
      }
      ackLabel="I understand this removes the entry from every dropdown that uses it"
      confirmLabel="Delete entry"
      workingLabel="Deleting…"
      loading={isLoading}
      error={error}
    />
  );
}
