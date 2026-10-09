'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { ConfirmDialog, FormField, Modal, TableCard } from '@/components/ui/controls';
import { ButtonLoader } from '@/components/ui/Loaders';
import { DataLoader } from '@/components/ui/DataLoader';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import {
  useSellerCreateRoleMutation,
  useSellerDeleteRoleMutation,
  useSellerPermissionCatalogQuery,
  useSellerRolesQuery,
  useSellerUpdateRoleMutation,
  useSellerUpdateRolePermissionsMutation,
} from '@/services/sellerTeamApi';
import { SellerForbidden, useSellerCan } from '@/components/seller/SellerGuards';
import { sellerRoleSchema } from '@/lib/validations';
import { normaliseApiError } from '@/types/api';

export function RolesView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  const canRead = can('role:read');
  const canCreate = can('role:create');
  const canUpdate = can('role:update');
  const canDelete = can('role:delete');

  const rolesQuery = useSellerRolesQuery(storeId, { skip: !storeId || !canRead });
  const catalogQuery = useSellerPermissionCatalogQuery(storeId, { skip: !storeId || !canRead });
  const [createRole, { isLoading: creating }] = useSellerCreateRoleMutation();
  const [updateMeta, { isLoading: savingMeta }] = useSellerUpdateRoleMutation();
  const [savePerms, { isLoading: savingPerms }] = useSellerUpdateRolePermissionsMutation();
  const [deleteRole, { isLoading: deleting }] = useSellerDeleteRoleMutation();

  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const roles = useMemo(() => rolesQuery.data?.data ?? [], [rolesQuery.data]);
  const groups = useMemo(() => catalogQuery.data?.data ?? [], [catalogQuery.data]);
  const current = roles.find((r) => r.key === (selected ?? roles[0]?.key)) ?? null;
  // Effective grant set: explicit selection drives `draft`; before any click
  // the first role's saved grants show. Unchecking everything yields [] —
  // still correct because `selected != null` keeps `draft` authoritative.
  const effective = selected != null ? draft : (current?.permissions ?? []);

  if (!canRead) return <Box sx={{ mt: 0.5 }}><SellerForbidden /></Box>;
  if (rolesQuery.isLoading) return <DataLoader label="Loading roles" variant="skeleton" />;
  if (rolesQuery.isError) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => rolesQuery.refetch()}>Retry</Button>}>
        Couldn&apos;t load roles — {normaliseApiError(rolesQuery.error as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  function openEdit() {
    if (!current) return;
    setName(current.name);
    setDescription(current.description ?? '');
    setDraft([...current.permissions]);
    setError(null);
    setEditOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = sellerRoleSchema.safeParse({ key, name, description });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
      return;
    }
    try {
      const res = await createRole({ storeId, ...parsed.data, permissionKeys: [] }).unwrap();
      setCreateOpen(false);
      setKey(''); setName(''); setDescription('');
      setSelected(res.data.key);
      rolesQuery.refetch();
    } catch (err) {
      setError(normaliseApiError(err as { status?: number; data?: unknown }).message);
    }
  }

  function togglePerm(permKey: string) {
    const base = selected != null ? draft : (current?.permissions ?? []);
    const next = base.includes(permKey) ? base.filter((p) => p !== permKey) : [...base, permKey];
    if (selected == null && current) setSelected(current.key);
    setDraft(next);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Roles & permissions</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            {systemRoles.length} system roles · {customRoles.length} custom roles · keys are permanent slugs.
          </Typography>
        </Box>
        {canCreate ? (
          <Button size="small" variant="contained" startIcon={<VpnKeyIcon fontSize="small" />} onClick={() => { setError(null); setCreateOpen(true); }}>
            New role
          </Button>
        ) : null}
      </Box>

      <GuideAccordion title="How roles work">
        <HowRow n={1}>System roles (owner, admin, staff) ship with every store — they can never be deleted.</HowRow>
        <HowRow n={2}>Custom roles start empty: create one, tick permissions below, then assign members on the Team page.</HowRow>
        <HowRow n={3}>Saving the matrix replaces every permission at once. The owner role is immutable — the backend rejects changes.</HowRow>
      </GuideAccordion>

      {error && !createOpen && !editOpen ? <Alert severity="error" role="alert" onClose={() => setError(null)}>{error}</Alert> : null}

      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' } }}>
        <TableCard title="Roles" subtitle="Select a role to edit its permissions">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {roles.map((r) => {
              const isActive = (selected ?? roles[0]?.key) === r.key;
              return (
                <Button
                  key={r.key}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  onClick={() => { setSelected(r.key); setDraft([...r.permissions]); }}
                  sx={{ justifyContent: 'space-between' }}
                >
                  <span>{r.name}</span>
                  <span style={{ opacity: 0.75 }}>{r.memberCount} · {r.permissions.length} perms{r.isSystem ? ' · system' : ''}</span>
                </Button>
              );
            })}
          </Box>
          {current && canDelete && !current.isSystem ? (
            <Button size="small" variant="outlined" color="error" sx={{ mt: 1 }} onClick={() => setDeleteTarget(current.key)}>
              Delete {current.name}
            </Button>
          ) : null}
        </TableCard>

        <TableCard
          title={current ? `Permissions — ${current.name}` : 'Permissions'}
          subtitle={current ? `${current.permissions.length} granted · rendered from the live catalog, never hardcoded` : undefined}
          actions={current && canUpdate && !editOpen ? <Button size="small" variant="outlined" onClick={openEdit}>Rename role</Button> : undefined}
          empty={{ when: !current, title: 'No role selected', description: 'Create a role to start assigning permissions.' }}
        >
          {current ? (
            catalogQuery.isLoading ? <DataLoader label="Loading permission catalog" variant="inline" /> : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {groups.map((g) => (
                  <Box key={g.resource}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>
                      {g.resource} · {g.permissions.filter((p) => effective.includes(p.key)).length}/{g.permissions.length}
                    </Typography>
                    <Table size="small" aria-label={`${g.resource} permissions`}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Allow</TableCell>
                          <TableCell>Permission</TableCell>
                          <TableCell>What it unlocks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {g.permissions.map((p) => {
                          const checked = effective.includes(p.key);
                          const locked = current.key === 'owner' || !canUpdate;
                          return (
                            <TableRow key={p.key}>
                              <TableCell padding="checkbox">
                                <Checkbox checked={checked} disabled={locked} onChange={() => togglePerm(p.key)} slotProps={{ input: { 'aria-label': p.key } }} />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.key}</TableCell>
                              <TableCell sx={{ fontSize: '0.82rem' }}>{p.label} — {p.description}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                ))}
                {canUpdate && current.key !== 'owner' ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip size="small" label={`${effective.length} selected`} variant="outlined" />
                    <Box sx={{ flex: 1 }} />
                    <Button size="small" variant="contained" disabled={savingPerms} onClick={async () => {
                      try {
                        await savePerms({ storeId, roleKey: current.key, permissionKeys: effective }).unwrap();
                        setDraft([...effective]);
                        rolesQuery.refetch();
                      } catch (err) { setError(normaliseApiError(err as { status?: number; data?: unknown }).message); }
                    }}>
                      {savingPerms ? <ButtonLoader label="Saving" /> : 'Save permissions'}
                    </Button>
                  </Box>
                ) : (
                  <Alert severity="info">The owner role is immutable — every permission stays granted.</Alert>
                )}
              </Box>
            )
          ) : null}
        </TableCard>
      </Box>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a custom role"
        subtitle="Step 1 — key + name · Step 2 — tick permissions in the matrix"
        icon={<VpnKeyIcon fontSize="small" />}
        maxWidth="xs"
        actions={
          <>
            <Button size="small" variant="outlined" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="small" variant="contained" onClick={(e) => submitCreate(e as unknown as React.FormEvent)} disabled={creating}>
              {creating ? <ButtonLoader label="Creating" /> : 'Create role'}
            </Button>
          </>
        }
      >
        <Box component="form" onSubmit={submitCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
          <FormField label="Step 1 — key (permanent slug)" value={key} onChange={(e) => setKey(e.target.value)} hint="Lowercase letters, numbers, hyphens — e.g. inventory-manager." />
          <FormField label="Step 1 — display name" value={name} onChange={(e) => setName(e.target.value)} hint="Shown on the Team page and in invitations." />
          <FormField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
        </Box>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Rename — ${current?.key ?? ''}`}
        subtitle="Keys are permanent slugs and cannot change."
        icon={<VpnKeyIcon fontSize="small" />}
        maxWidth="xs"
        actions={
          <>
            <Button size="small" variant="outlined" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button size="small" variant="contained" disabled={savingMeta} onClick={async () => {
              if (!current) return;
              try {
                await updateMeta({ storeId, roleKey: current.key, name, description }).unwrap();
                setEditOpen(false);
                rolesQuery.refetch();
              } catch (err) { setError(normaliseApiError(err as { status?: number; data?: unknown }).message); }
            }}>
              {savingMeta ? <ButtonLoader label="Saving" /> : 'Save name'}
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
          <FormField label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
          <FormField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
        </Box>
      </Modal>

      <ConfirmDialog
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title={`Delete role “${deleteTarget ?? ''}”?`}
        tone="danger"
        consequence="Members and pending invitations must be moved off first — the backend refuses while the role is in use."
        confirmWord={deleteTarget ?? undefined}
        confirmLabel="Delete role"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteRole({ storeId, roleKey: deleteTarget }).unwrap();
            setSelected(null);
            rolesQuery.refetch();
          } catch (err) { setError(normaliseApiError(err as { status?: number; data?: unknown }).message); }
          setDeleteTarget(null);
        }}
      />
    </Box>
  );
}
