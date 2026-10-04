'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { DetailRow } from '@/components/ui/Guide';
import { ConfirmDialog } from '@/components/ui/controls';
import { AccessDenied, usePermissions, useViewerIsSuperAdmin } from '@/components/auth/RbacGuard';
import { PermissionMatrix } from './PermissionMatrix';
import { api } from '@/services/api';
import {
  usePermissionGroupsQuery,
  useReplaceRolePermissionsMutation,
  useRoleDetailQuery,
} from '@/services/rbacApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openRoleDialog, selectRole } from '@/store/rbacSlice';
import { normaliseApiError } from '@/types/api';
import type { RbacErrorDetails } from '@/types/rbac';
import { detailsCode, formatDay, useResetKey } from '@/lib/utils';
import { mercatoTokens } from '@/lib/theme';

/**
 * Screen 3 — role header + permission matrix + save bar.
 * Selection comes from the Redux slice (set by the table, create/clone flows).
 */
export function RoleDetail({ notify }: { notify: (msg: string) => void }) {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector((s) => s.rbac.selectedRoleKey);
  const { can } = usePermissions();
  const viewerIsSuperAdmin = useViewerIsSuperAdmin();

  const canUpdate = can('role.update');
  const {
    data: roleRes,
    isLoading: roleLoading,
    isError: roleError,
    error: roleErrorBody,
    refetch: refetchRole,
  } = useRoleDetailQuery(selectedKey ?? '', { skip: !selectedKey });
  const { data: groupsRes, isLoading: groupsLoading } = usePermissionGroupsQuery(undefined, {
    skip: !selectedKey,
  });

  const role = roleRes?.data ?? null;
  const groups = groupsRes?.data;

  const [draft, setDraft] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveRequestId, setSaveRequestId] = useState<string | null>(null);
  const [unheld, setUnheld] = useState<string[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [triggerSave, { isLoading: saving }] = useReplaceRolePermissionsMutation();

  // Resync the draft when another role is selected or fresh data lands.
  useResetKey(role ? `${role.key}:${role.updatedAt}` : null, () => {
    setDraft([...(role?.permissions ?? [])]);
    setSaveError(null);
    setSaveRequestId(null);
    setUnheld([]);
  });

  const dirty = useMemo(() => {
    const base = [...(role?.permissions ?? [])].sort().join(',');
    return [...draft].sort().join(',') !== base;
  }, [draft, role]);

  if (!selectedKey) return null;

  const toggle = (key: string) =>
    setDraft((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const toggleGroup = (keys: string[], select: boolean) =>
    setDraft((prev) =>
      select ? [...new Set([...prev, ...keys])] : prev.filter((k) => !keys.includes(k)),
    );

  const submit = async (keys: string[]) => {
    if (!role) return;
    setSaveError(null);
    setSaveRequestId(null);
    setUnheld([]);
    try {
      await triggerSave({ key: role.key, permissionKeys: keys }).unwrap();
      notify(`Permissions saved for ${role.name}. Logged to Activity log.`);
    } catch (err) {
      const norm = normaliseApiError(err);
      // Machine codes live in `details.code`, not the envelope `error.code`.
      if (detailsCode(err) === 'CANNOT_GRANT_UNHELD_PERMISSION') {
        const held = (norm.details as RbacErrorDetails | null | undefined)?.unheld ?? [];
        setUnheld(Array.isArray(held) ? held.map(String) : []);
      }
      setSaveError(norm.message);
      setSaveRequestId(norm.requestId ?? null);
    }
  };

  const handleSave = () => {
    if (!role) return;
    // Full-replace semantics: clearing everything needs an explicit confirm.
    if (draft.length === 0 && role.permissions.length > 0) setClearConfirm(true);
    else void submit(draft);
  };

  if (roleLoading) {
    return (
      <Paper id="role-detail" component="section" aria-label="Role detail" sx={{ p: 2 }}>
        <DataLoader variant="skeleton" lines={4} label="Loading role" />
      </Paper>
    );
  }
  if (roleError || !role) {
    if (normaliseApiError(roleErrorBody).status === 403) return <AccessDenied />;
    // The key was removed or renamed — drop the selection and refresh the list.
    if (normaliseApiError(roleErrorBody).status === 404) {
      return (
        <Paper id="role-detail" component="section" aria-label="Role detail" sx={{ p: 2 }}>
          <FallbackUI
            tone="error"
            title="Role no longer exists"
            description="That role key was removed or renamed. Refresh the list to continue."
            actionLabel="Refresh list"
            onAction={() => {
              dispatch(api.util.invalidateTags(['Roles']));
              dispatch(selectRole(null));
            }}
          />
        </Paper>
      );
    }
    return (
      <Paper id="role-detail" component="section" aria-label="Role detail" sx={{ p: 2 }}>
        <FallbackUI
          tone="error"
          title="Could not load role"
          description={normaliseApiError(roleErrorBody).message}
          actionLabel="Retry"
          onAction={() => refetchRole()}
        />
      </Paper>
    );
  }

  const isSuperAdmin = role.key === 'super_admin';
  const saveLocked = !canUpdate || (isSuperAdmin && !viewerIsSuperAdmin);

  return (
    <Paper id="role-detail" component="section" aria-label={`Role detail — ${role.name}`} sx={{ p: 2, scrollMarginTop: 12 }}>
      {/* Header block */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h2">{role.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'ui-monospace, monospace' }}>
            {role.key}
          </Typography>
          {role.description ? (
            <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.5 }}>
              {role.description}
            </Typography>
          ) : null}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
            {role.isSystem ? (
              <Chip label="System" size="small" sx={{ bgcolor: mercatoTokens.text, color: '#fff' }} />
            ) : null}
            <Chip
              label={role.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              size="small"
              sx={
                role.status === 'ACTIVE'
                  ? { bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }
                  : { bgcolor: 'action.hover', color: 'text.secondary' }
              }
            />
            <Chip
              label={`${role.assignedAdmins} admin${role.assignedAdmins === 1 ? '' : 's'}`}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        {canUpdate ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => dispatch(openRoleDialog({ kind: 'editMeta', roleKey: role.key }))}
          >
            Edit name
          </Button>
        ) : null}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0, mt: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <DetailRow label="Created">
          <Typography sx={{ fontSize: '0.88rem' }}>{formatDay(role.createdAt)}</Typography>
        </DetailRow>
        <DetailRow label="Updated">
          <Typography sx={{ fontSize: '0.88rem' }}>{formatDay(role.updatedAt)}</Typography>
        </DetailRow>
      </Box>

      {isSuperAdmin ? (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          <b>Super Admin implies all permissions</b> — editing its grant list has no effect.
          {!viewerIsSuperAdmin ? ' Saving is disabled because you are not a Super Admin.' : ''}
        </Alert>
      ) : null}

      {/* Matrix block */}
      <Typography variant="h2" sx={{ mt: 2, fontSize: '1rem' }}>
        Permissions — {draft.length} selected
        {dirty ? ' · unsaved changes' : ''}
      </Typography>
      {!canUpdate ? (
        <Typography color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.5 }}>
          You hold <b>role.read</b> but not <b>role.update</b> — the matrix is read-only.
        </Typography>
      ) : null}
      <PermissionMatrix
        groups={groups}
        loading={groupsLoading}
        checked={draft}
        onToggle={toggle}
        onToggleGroup={toggleGroup}
        disabled={saveLocked}
        unheld={unheld}
      />
      {saveError ? (
        <Alert severity="error" role="alert" sx={{ mt: 1.5 }}>
          {saveError}
          {unheld.length > 0 ? ' Ask a Super Admin to grant them first.' : ''}
          {saveRequestId ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Reference: {saveRequestId} — include it in bug reports.
            </Typography>
          ) : null}
        </Alert>
      ) : null}

      {/* Sticky save bar */}
      <Box
        role="status"
        sx={{
          position: 'sticky',
          bottom: 0,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.25,
          mt: 2,
          p: 1.5,
          pl: 2,
          borderRadius: 3.5,
          bgcolor: dirty ? mercatoTokens.text : 'action.hover',
          color: dirty ? '#fff' : 'text.secondary',
        }}
      >
        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
          {dirty
            ? 'You have unsaved changes — leaving now would lose them.'
            : 'No unsaved changes.'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="outlined"
          disabled={!dirty || saveLocked}
          onClick={() => {
            setDraft([...(role?.permissions ?? [])]);
            setUnheld([]);
            setSaveError(null);
            setSaveRequestId(null);
          }}
          sx={dirty && !saveLocked ? { color: '#fff', borderColor: 'rgba(255,255,255,0.4)' } : undefined}
        >
          Discard
        </Button>
        <Button size="small" variant="contained" disabled={!dirty || saveLocked || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Confirm + save'}
        </Button>
      </Box>

      <ConfirmDialog
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={() => {
          setClearConfirm(false);
          void submit([]);
        }}
        loading={saving}
        tone="info"
        title={`Clear all permissions — ${role.name}?`}
        consequence={
          <>
            This removes <b>all {role.permissions.length} permissions</b> at once. Admins holding
            only this role lose those permissions immediately (next request).
          </>
        }
        description="Full-replace save: the complete checked list is sent, and right now nothing is checked."
        confirmLabel="Clear everything"
      />
    </Paper>
  );
}
