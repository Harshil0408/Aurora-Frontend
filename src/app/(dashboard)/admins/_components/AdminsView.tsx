'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import { format, parseISO } from 'date-fns';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { DetailRow } from '@/components/ui/Guide';
import {
  ConfirmDialog,
  FormField,
  Modal,
  SearchField,
  SelectField,
  TableCard,
} from '@/components/ui/controls';
import { mercatoTokens } from '@/lib/theme';
import { statusTone } from '@/lib/variables';
import { useMeQuery } from '@/services/authApi';
import {
  useAdminDetailQuery,
  useAdminSummaryQuery,
  useCreateAdminMutation,
  useGeneratePasswordMutation,
  useLazyCheckEmailQuery,
  useListAdminsQuery,
  useListRolesQuery,
  useRevokeAdminSessionsMutation,
  useUpdateRolesMutation,
  useUpdateStatusMutation,
} from '@/services/adminsApi';
import { clearAuth } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { normaliseApiError } from '@/types/api';
import type {
  AdminListItem,
  AdminRoleOption,
  AdminStatus,
  AdminStatusTab,
} from '@/types/admins';
import { ADMIN_STATUS_LABEL, isSuperAdminKey } from '@/types/admins';

type DialogKind = null | 'create' | 'details' | 'status' | 'roles' | 'revoke';

const PAGE_LIMIT = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Machine code from `error.details.code` (HTTP enum sits in `error.code`). */
function machineCode(err: unknown): string | undefined {
  const details = normaliseApiError(err).details as { code?: unknown } | null | undefined;
  return typeof details?.code === 'string' ? details.code : undefined;
}

function withRequestId(message: string, err: unknown): string {
  const requestId = normaliseApiError(err).requestId;
  return requestId ? `${message} · #${requestId}` : message;
}

function formatMonth(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM yyyy');
  } catch {
    return iso;
  }
}

function formatDay(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'MMM d, yyyy · HH:mm');
  } catch {
    return iso;
  }
}

function roleName(options: AdminRoleOption[], key: string): string {
  return options.find((o) => o.key === key)?.name ?? key;
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
  );
}


export function AdminsView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: meData } = useMeQuery(undefined, { skip: !isAuthenticated });
  const viewerIsSuperAdmin = useMemo(
    () => (meData?.data.roles ?? []).some((r) => isSuperAdminKey(r)),
    [meData],
  );

  // Filters + pagination (server-side; page resets on any filter change).
  const [tab, setTab] = useState<AdminStatusTab>('All');
  const [roleFilter, setRoleFilter] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    setPage(1);
  }, [tab, roleFilter, debounced]);

  const listArgs = {
    page,
    limit: PAGE_LIMIT,
    status: tab === 'All' ? undefined : tab,
    role: roleFilter || undefined,
    search: debounced.length >= 2 ? debounced : undefined,
  };
  const {
    data: listRes,
    isLoading: listLoading,
    isError: listError,
    error: listErrorBody,
    refetch: refetchList,
  } = useListAdminsQuery(listArgs);
  const { data: summaryRes } = useAdminSummaryQuery();
  const { data: rolesRes } = useListRolesQuery();

  const rows = useMemo(() => listRes?.data ?? [], [listRes]);
  const pagination = listRes?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const counts = listRes?.meta?.counts ?? {
    total: summaryRes?.data.total ?? 0,
    active: summaryRes?.data.active ?? 0,
    suspended: summaryRes?.data.suspended ?? 0,
    disabled: summaryRes?.data.disabled ?? 0,
  };
  const summary = summaryRes?.data;
  const twoFactorEnabled = listRes?.meta?.twoFactorEnabled ?? summary?.twoFactorEnabled ?? 0;
  const needsAttention = summary?.needsAttention ?? counts.suspended + counts.disabled;

  // Role options: canonical list from the API; fall back to the union of
  // roles present on loaded rows (never a hardcoded constant).
  const roleOptions: AdminRoleOption[] = useMemo(() => {
    if (rolesRes?.data?.length) return rolesRes.data;
    const seen = new Map<string, string>();
    for (const a of rows) for (const r of a.roles) seen.set(r.key, r.name);
    return [...seen].map(([key, name]) => ({ key, name }));
  }, [rolesRes, rows]);

  // Row menu + dialogs.
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<AdminListItem | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: detailRes, isLoading: detailLoading } = useAdminDetailQuery(selected?.id ?? '', {
    skip: !selected || dialog !== 'details',
  });
  const detail = detailRes?.data ?? null;

  const openMenu = (e: React.MouseEvent<HTMLElement>, admin: AdminListItem) => {
    setSelected(admin);
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => setMenuAnchor(null);
  const openDialog = (kind: Exclude<DialogKind, null>) => {
    closeMenu();
    if (kind === 'create') resetCreate();
    if (kind === 'status' && selected) {
      setStatusChoice(selected.status);
      setReason('');
      setReasonError(null);
      setStatusBlocked(false);
      setStatusError(null);
    }
    if (kind === 'roles' && selected) {
      setRoleSelection(selected.roles.map((r) => r.key));
      setRolesError(null);
      setRolesBlocked(false);
    }
    if (kind === 'revoke') setRevokeError(null);
    setDialog(kind);
  };

  // Create Admin form.
  const [createStep, setCreateStep] = useState(0);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoleKeys, setCreateRoleKeys] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [triggerCheckEmail, { isLoading: checkingEmail }] = useLazyCheckEmailQuery();
  const [triggerGenerate, { isLoading: generating }] = useGeneratePasswordMutation();
  const [triggerCreate, { isLoading: creating }] = useCreateAdminMutation();

  const resetCreate = () => {
    setCreateStep(0);
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRoleKeys([]);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setCreateError(null);
  };

  const submitCreateStep0 = async () => {
    let ok = true;
    if (createName.trim().length < 2) {
      setNameError('Enter the full name (at least 2 characters).');
      ok = false;
    } else setNameError(null);
    if (!EMAIL_RE.test(createEmail.trim())) {
      setEmailError('Enter a valid work email.');
      ok = false;
    } else setEmailError(null);
    if (createPassword.length < 12) {
      setPasswordError('Temporary password must be at least 12 characters.');
      ok = false;
    } else setPasswordError(null);
    if (!ok) return;
    try {
      const res = await triggerCheckEmail(createEmail.trim()).unwrap();
      if (!res.data.available) {
        setEmailError('This email is already in use.');
        return;
      }
    } catch {
      // Availability check is best-effort; the server re-validates on create.
    }
    setCreateStep(1);
  };

  const submitCreate = async () => {
    if (createRoleKeys.length === 0) {
      setCreateError('Pick at least one role — it decides what they can do.');
      return;
    }
    setCreateError(null);
    try {
      const res = await triggerCreate({
        email: createEmail.trim(),
        name: createName.trim(),
        tempPassword: createPassword,
        roleKeys: createRoleKeys,
      }).unwrap();
      setDialog(null);
      resetCreate();
      setToast(
        res.data.inviteSent
          ? `Admin created for ${res.data.email} — invitation sent.`
          : `Admin created for ${res.data.email}.`,
      );
    } catch (err) {
      const code = machineCode(err);
      if (code === 'EMAIL_IN_USE') {
        setEmailError(normaliseApiError(err).message);
        setCreateStep(0);
      } else {
        setCreateError(withRequestId(normaliseApiError(err).message, err));
      }
    }
  };

  // Change status form.
  const [statusChoice, setStatusChoice] = useState<AdminStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [statusBlocked, setStatusBlocked] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [triggerStatus, { isLoading: savingStatus }] = useUpdateStatusMutation();

  const submitStatus = async () => {
    if (!selected) return;
    if (reason.trim().length < 3) {
      setReasonError('Add a short reason — it shows in the Activity Log.');
      return;
    }
    setReasonError(null);
    setStatusError(null);
    try {
      await triggerStatus({ id: selected.id, status: statusChoice, reason: reason.trim() }).unwrap();
      setDialog(null);
      const label = ADMIN_STATUS_LABEL[statusChoice];
      setToast(
        statusChoice === 'DISABLED'
          ? `Status → ${label} for ${selected.email} · sessions revoked.`
          : `Status → ${label} for ${selected.email}.`,
      );
    } catch (err) {
      const code = machineCode(err);
      if (code === 'LAST_SUPER_ADMIN') setStatusBlocked(true);
      else if (code === 'CANNOT_CHANGE_OWN_STATUS')
        setStatusError('You cannot change your own status.');
      else setStatusError(withRequestId(normaliseApiError(err).message, err));
    }
  };

  // Manage roles form.
  const [roleSelection, setRoleSelection] = useState<string[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesBlocked, setRolesBlocked] = useState(false);
  const [triggerRoles, { isLoading: savingRoles }] = useUpdateRolesMutation();

  const submitRoles = async () => {
    if (!selected) return;
    if (roleSelection.length === 0) {
      setRolesError('At least one role is required.');
      return;
    }
    setRolesError(null);
    try {
      const res = await triggerRoles({ id: selected.id, roleKeys: roleSelection }).unwrap();
      setDialog(null);
      const parts: string[] = [];
      if (res.data.added.length > 0)
        parts.push(`+ ${res.data.added.map((k) => roleName(roleOptions, k)).join(', ')}`);
      if (res.data.removed.length > 0)
        parts.push(`− ${res.data.removed.map((k) => roleName(roleOptions, k)).join(', ')}`);
      setToast(parts.length > 0 ? `Roles updated for ${selected.email} (${parts.join(' · ')}).` : `Roles updated for ${selected.email}.`);
    } catch (err) {
      const code = machineCode(err);
      if (code === 'LAST_SUPER_ADMIN') setRolesBlocked(true);
      else setRolesError(withRequestId(normaliseApiError(err).message, err));
    }
  };

  // Revoke sessions.
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [triggerRevoke, { isLoading: revoking }] = useRevokeAdminSessionsMutation();

  const submitRevoke = async () => {
    if (!selected) return;
    setRevokeError(null);
    try {
      const res = await triggerRevoke(selected.id).unwrap();
      const wasSelf = selected.isSelf;
      const email = selected.email;
      const count = res.data.revokedCount;
      setDialog(null);
      setToast(`Revoked ${count} session${count === 1 ? '' : 's'} for ${email}.`);
      if (wasSelf) {
        // Revoking your own sessions ends your session too — same as sign-out everywhere.
        dispatch(clearAuth());
        router.replace('/login');
      }
    } catch (err) {
      setRevokeError(withRequestId(normaliseApiError(err).message, err));
    }
  };

  const start = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const end = Math.min(page * PAGE_LIMIT, total);
  const clearFilters = () => {
    setQuery('');
    setTab('All');
    setRoleFilter('');
    setPage(1);
  };

  const addedKeys = selected ? roleSelection.filter((k) => !selected.roles.some((r) => r.key === k)) : [];
  const removedKeys = selected ? selected.roles.map((r) => r.key).filter((k) => !roleSelection.includes(k)) : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Compact header */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1.5,
          mt: 0.5,
        }}
      >
        <Box>
          <Typography variant="h1" component="h1">Admins</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
            People who can sign in to this console — statuses, roles, and sessions per account.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog('create')}>
          Create Admin
        </Button>
      </Box>

      {/* Team summary strip */}
      <Paper component="section" aria-label="Team summary" sx={{ py: 1.5, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              borderRadius: 2.5,
              bgcolor: mercatoTokens.brandSoft,
              color: 'primary.dark',
              flex: 'none',
            }}
          >
            <GroupIcon fontSize="small" />
          </Box>
          <MiniStat value={summary ? String(summary.total) : '…'} label="Total admins" />
          <MiniStat value={summary ? String(summary.active) : '…'} label="Active" />
          <MiniStat value={summary ? String(needsAttention) : '…'} label="Needs attention" />
          <MiniStat
            value={summary ? `${twoFactorEnabled}/${summary.total}` : '…'}
            label="2FA enabled"
          />
        </Box>
      </Paper>

      <TableCard
        title="Team members"
        subtitle={
          total > 0
            ? `${total} admin${total === 1 ? '' : 's'} · ${needsAttention} need${needsAttention === 1 ? 's' : ''} attention · ${twoFactorEnabled} with 2FA — page ${page} of ${totalPages}`
            : 'Admin accounts live here once the first one is created.'
        }
        toolbar={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Tabs
              value={tab}
              onChange={(_, v: AdminStatusTab) => setTab(v)}
              aria-label="Filter by status"
              sx={{ minHeight: 40 }}
            >
              {(['All', 'ACTIVE', 'SUSPENDED', 'DISABLED'] as AdminStatusTab[]).map((t) => {
                const label = t === 'All' ? 'All' : ADMIN_STATUS_LABEL[t];
                const count =
                  t === 'All' ? counts.total : counts[t.toLowerCase() as keyof typeof counts] ?? 0;
                return (
                  <Tab
                    key={t}
                    value={t}
                    label={`${label} · ${count}`}
                    sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
                  />
                );
              })}
            </Tabs>
            <Box sx={{ flex: 1 }} />
            <SearchField
              placeholder="Search name or email…"
              aria-label="Search admins by name or email"
              value={query}
              onChange={setQuery}
              minWidth={200}
            />
            <SelectField
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[{ value: '', label: 'All roles' }, ...roleOptions.map((r) => ({ value: r.key, label: r.name }))]}
              minWidth={150}
            />
          </Box>
        }
        footer={
          <>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
              Showing <b>{start}–{end}</b> of <b>{total}</b> admins
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="small" variant="contained" disabled>
              {page} / {totalPages}
            </Button>
            <Button size="small" variant="outlined" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </>
        }
        empty={{
          when: !listLoading && !listError && rows.length === 0,
          title: 'No admins match these filters',
          description: 'Try a different name, status tab, or role — or clear the search.',
          actionLabel: 'Clear filters',
          onAction: clearFilters,
        }}
      >
        {listLoading ? (
          <Box sx={{ mt: 1.5 }}><DataLoader variant="skeleton" lines={4} label="Loading admins" /></Box>
        ) : listError ? (
          <Box sx={{ mt: 1.5 }}>
            <FallbackUI
              tone="error"
              title="Could not load admins"
              description={withRequestId(normaliseApiError(listErrorBody).message, listErrorBody)}
              actionLabel="Retry"
              onAction={() => refetchList()}
            />
          </Box>
        ) : (
          <TableContainer sx={{ mt: 1.5, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
            <Table aria-label="Admins" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>2FA</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((a) => {
                  const label = ADMIN_STATUS_LABEL[a.status];
                  return (
                    <TableRow
                      key={a.id}
                      hover
                      sx={a.isSelf ? { bgcolor: mercatoTokens.brandSoft } : undefined}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {a.email}
                          {a.isSelf ? (
                            <Chip label="YOU" size="small" sx={{ ml: 1, height: 20, fontSize: '0.66rem', bgcolor: 'primary.main', color: '#fff' }} />
                          ) : null}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{a.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={label} size="small" sx={{ bgcolor: statusTone[label as keyof typeof statusTone].bg, color: statusTone[label as keyof typeof statusTone].color }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {a.roles.map((r) => (
                            <Chip
                              key={r.key}
                              label={r.name}
                              size="small"
                              sx={isSuperAdminKey(r.key)
                                ? { bgcolor: mercatoTokens.brandSoft, color: mercatoTokens.brandStrong }
                                : { bgcolor: 'action.hover', color: 'text.secondary' }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: '0.84rem', fontWeight: 700, color: a.twoFactor.enabled ? 'success.main' : 'text.secondary' }}>
                          <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: a.twoFactor.enabled ? 'success.main' : 'divider' }} />
                          {a.twoFactor.enabled ? 'Enabled' : 'Not set'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatMonth(a.createdAt)}</TableCell>
                      <TableCell align="right">
                        <IconButton aria-label={`Actions for ${a.email}`} aria-haspopup="menu" onClick={(e) => openMenu(e, a)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TableCard>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} aria-label="Row actions">
        <MenuItem onClick={() => openDialog('details')}><VisibilityIcon fontSize="small" style={{ marginRight: 8 }} />View details</MenuItem>
        <MenuItem
          onClick={() => openDialog('status')}
          disabled={selected?.isSelf === true}
          title={selected?.isSelf ? 'You cannot change your own status' : undefined}
        >
          Change status{selected?.isSelf ? ' (disabled — your own row)' : ''}
        </MenuItem>
        <MenuItem onClick={() => openDialog('roles')}>Manage roles</MenuItem>
        <MenuItem onClick={() => openDialog('revoke')} sx={{ color: 'error.main' }}>Revoke sessions</MenuItem>
      </Menu>

      {/* 1. Create Admin — stepped: account, then roles */}
      <Modal
        open={dialog === 'create'}
        onClose={() => setDialog(null)}
        title="Create Admin"
        subtitle="Two quick screens: account, then roles."
        icon={<AddIcon fontSize="small" />}
        maxWidth="sm"
        actions={
          createStep === 0 ? (
            <>
              <Button onClick={() => setDialog(null)}>Cancel</Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={submitCreateStep0} disabled={checkingEmail}>
                {checkingEmail ? 'Checking email…' : 'Next: roles'}
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => setCreateStep(0)}>Back</Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={submitCreate} disabled={creating}>
                {creating ? 'Creating…' : 'Create admin'}
              </Button>
            </>
          )
        }
      >
        <Stepper activeStep={createStep} alternativeLabel>
          <Step>
            <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
              Account
            </StepLabel>
          </Step>
          <Step>
            <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>
              Roles
            </StepLabel>
          </Step>
        </Stepper>
        {createStep === 0 ? (
          <>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
              <b style={{ color: 'inherit' }}>Step 1 — account.</b> They sign
              in with this temporary password and set their own afterwards.
            </Typography>
            <FormField
              label="Full name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Ines Duarte"
              error={nameError != null}
              helperText={nameError ?? undefined}
            />
            <FormField
              label="Work email"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="new-admin@mercato.com"
              error={emailError != null}
              helperText={emailError ?? undefined}
            />
            <Box>
              <FormField
                label="Temporary password · min 12 characters"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                error={passwordError != null}
                helperText={passwordError ?? 'Weak passwords are rejected — use the generator.'}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" variant="outlined" onClick={() => triggerGenerate().unwrap().then((r) => setCreatePassword(r.data.password)).catch(() => setToast('Could not generate a password — type one instead.'))} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
              <b style={{ color: 'inherit' }}>Step 2 — roles.</b> At least one
              role is required; it decides what they can do.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }} role="group" aria-label="Roles for the new admin">
              {roleOptions.map((r) => {
                const gated = isSuperAdminKey(r.key) && !viewerIsSuperAdmin;
                const on = createRoleKeys.includes(r.key);
                return (
                  <Chip
                    key={r.key}
                    label={gated ? `${r.name} (Super-Admin-only)` : r.name}
                    clickable={!gated}
                    disabled={gated}
                    color={on ? 'primary' : 'default'}
                    variant={on ? 'filled' : 'outlined'}
                    onClick={gated ? undefined : () => setCreateRoleKeys((prev) => (on ? prev.filter((k) => k !== r.key) : [...prev, r.key]))}
                  />
                );
              })}
            </Box>
            {viewerIsSuperAdmin ? (
              <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                Signed in as Super Admin, so granting Super Admin is allowed. Everyone else sees that option disabled.
              </Typography>
            ) : null}
            {createError ? <Alert severity="error" role="alert">{createError}</Alert> : null}
          </>
        )}
      </Modal>

      {/* 2. Admin Details (view) */}
      <Modal
        open={dialog === 'details'}
        onClose={() => setDialog(null)}
        title={detail?.email ?? selected?.email ?? 'Admin details'}
        subtitle="Everything about this account on one screen. To change something, use the row menu."
        maxWidth="sm"
        actions={<Button onClick={() => setDialog(null)}>Close</Button>}
      >
        {detailLoading ? (
          <DataLoader variant="inline" label="Loading details" />
        ) : detail ? (
          <>
            <Divider sx={{ my: 0 }} />
            <DetailRow label="Name">
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{detail.name}</Typography>
            </DetailRow>
            <Divider />
            <DetailRow label="Status">
              <Chip label={ADMIN_STATUS_LABEL[detail.status]} size="small" sx={{ bgcolor: statusTone[ADMIN_STATUS_LABEL[detail.status] as keyof typeof statusTone].bg, color: statusTone[ADMIN_STATUS_LABEL[detail.status] as keyof typeof statusTone].color }} />
            </DetailRow>
            <Divider />
            <DetailRow label={`Roles (${detail.roles.length})`}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {detail.roles.map((r) => <Chip key={r.key} label={r.name} size="small" variant="outlined" />)}
              </Box>
            </DetailRow>
            <Divider />
            <DetailRow label="Two-factor">
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: detail.twoFactor.enabled ? 'success.main' : 'text.secondary' }}>
                {detail.twoFactor.enabled
                  ? `Enabled (${detail.twoFactor.methods.join(', ')})`
                  : 'Not set'}
              </Typography>
            </DetailRow>
            <Divider />
            <DetailRow label="Created">
              <Typography sx={{ fontSize: '0.88rem' }}>{formatDay(detail.createdAt)}</Typography>
            </DetailRow>
            <Divider />
            <DetailRow label="Last sign-in">
              <Typography sx={{ fontSize: '0.88rem' }}>{formatDay(detail.lastLoginAt)}</Typography>
            </DetailRow>
            <Divider />
            <DetailRow label={`Active sessions (${detail.activeSessionsCount})`}>
              <Typography sx={{ fontSize: '0.88rem' }}>
                {detail.activeSessionsCount} active session{detail.activeSessionsCount === 1 ? '' : 's'}
              </Typography>
            </DetailRow>
            <Divider />
            <DetailRow label={`Recent activity (${detail.recentActivity.length})`}>
              {detail.recentActivity.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  No recent activity recorded for this account.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {detail.recentActivity.map((ev) => (
                    <Box key={ev.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: '0.84rem', fontWeight: 700 }}>{ev.action}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        {[ev.actorEmail, ev.ipAddress, formatDay(ev.createdAt)].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </DetailRow>
          </>
        ) : (
          <Alert severity="error">Could not load details for this admin.</Alert>
        )}
      </Modal>

      {/* 3. Change Status (+ blocked variant for last Super Admin) */}
      <Modal
        open={dialog === 'status'}
        onClose={() => setDialog(null)}
        title={`Change status — ${selected?.email ?? ''}`}
        subtitle={statusBlocked || selected?.isLastActiveSuperAdmin ? 'Blocked: last Super Admin.' : 'Takes effect the moment you confirm.'}
        actions={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            {statusBlocked || selected?.isLastActiveSuperAdmin ? (
              <Button variant="contained" onClick={() => openDialog('roles')}>Manage roles instead</Button>
            ) : (
              <Button variant="contained" color="error" onClick={submitStatus} disabled={savingStatus}>
                {savingStatus ? 'Saving…' : 'Confirm change'}
              </Button>
            )}
          </>
        }
      >
        {statusBlocked || selected?.isLastActiveSuperAdmin ? (
          <Alert severity="error">
            <b>Last active Super Admin.</b> Suspending or disabling this account would leave no active Super Admin.
            Assign the Super Admin role to someone else first.
          </Alert>
        ) : (
          <>
            <Alert severity="warning">
              <b>Blocked the moment you confirm.</b> Suspended and Disabled both stop sign-in immediately.
            </Alert>
            <RadioGroup
              value={statusChoice}
              onChange={(e) => setStatusChoice(e.target.value as AdminStatus)}
              name="admin-status"
            >
              <FormControlLabel value="ACTIVE" control={<Radio />} label="Active — can sign in and work normally." />
              <FormControlLabel value="SUSPENDED" control={<Radio />} label="Suspended — blocks sign-in. Sessions held. Reversible." />
              <FormControlLabel value="DISABLED" control={<Radio />} label="Disabled — blocks sign-in. Sessions revoked." />
            </RadioGroup>
            <FormField
              label="Reason / note (shows in the Activity Log)"
              multiline
              rows={2}
              placeholder="e.g. Failed KYC re-check"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={reasonError != null}
              helperText={reasonError ?? undefined}
            />
            {statusError ? <Alert severity="error" role="alert" sx={{ mt: 1 }}>{statusError}</Alert> : null}
          </>
        )}
      </Modal>

      {/* 4. Manage Roles */}
      <Modal
        open={dialog === 'roles'}
        onClose={() => setDialog(null)}
        title={`Manage roles — ${selected?.email ?? ''}`}
        subtitle="Tick the roles they should have. At least one is required."
        actions={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={roleSelection.length === 0 || savingRoles}
              onClick={submitRoles}
            >
              {savingRoles ? 'Saving…' : 'Confirm role changes'}
            </Button>
          </>
        }
      >
        {rolesBlocked ? (
          <Alert severity="error">
            <b>Last active Super Admin.</b> Removing this role would leave no active Super Admin.
            Assign the Super Admin role to someone else first.
          </Alert>
        ) : (
          <>
            {roleOptions.map((r) => {
              const lockedOwnSA = selected?.isSelf === true && isSuperAdminKey(r.key);
              const gatedSA = isSuperAdminKey(r.key) && !viewerIsSuperAdmin;
              const checked = roleSelection.includes(r.key);
              return (
                <FormControlLabel
                  key={r.key}
                  control={
                    <Checkbox
                      checked={checked}
                      disabled={lockedOwnSA || gatedSA}
                      onChange={() => setRoleSelection((prev) => (checked ? prev.filter((x) => x !== r.key) : [...prev, r.key]))}
                    />
                  }
                  label={`${r.name}${lockedOwnSA ? ' (locked — your own role)' : ''}${gatedSA ? ' (Super-Admin-only grant)' : ''}`}
                />
              );
            })}
            {(addedKeys.length > 0 || removedKeys.length > 0) && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Summary:{' '}
                {addedKeys.length > 0 ? <b>+ {addedKeys.map((k) => roleName(roleOptions, k)).join(', ')}</b> : null}
                {addedKeys.length > 0 && removedKeys.length > 0 ? ' · ' : null}
                {removedKeys.length > 0 ? <b>− {removedKeys.map((k) => roleName(roleOptions, k)).join(', ')}</b> : null}
              </Alert>
            )}
            {rolesError ? <Alert severity="error" role="alert" sx={{ mt: 1 }}>{rolesError}</Alert> : null}
          </>
        )}
      </Modal>

      {/* Revoke sessions confirm */}
      <ConfirmDialog
        open={dialog === 'revoke'}
        onClose={() => setDialog(null)}
        onConfirm={submitRevoke}
        loading={revoking}
        error={revokeError}
        title={`Revoke sessions — ${selected?.email ?? ''}?`}
        consequence={
          <>
            <b>They are signed out everywhere, immediately</b> — laptop, phone,
            every tab. They sign back in with email + password (+ code if 2FA is on).
          </>
        }
        description="Use this when a device is lost, after a status change, or when anything looks suspicious. The account itself is untouched."
        confirmLabel="Revoke sessions"
      />

      <Snackbar
        open={toast != null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
