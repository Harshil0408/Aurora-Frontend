'use client';

import { useState } from 'react';
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
import { DataLoader } from '@/components/ui/DataLoader';
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
import {
  ADMINS,
  ALL_ROLES,
  VIEWER_IS_SUPER_ADMIN,
  statusTone,
  tabs,
} from '@/lib/variables';
import type {
  DialogKind,
  SampleAdmin,
} from '@/lib/variables';

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
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [query, setQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<SampleAdmin>(ADMINS[2]);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [createStep, setCreateStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [roleSelection, setRoleSelection] = useState<string[]>(['Sub-Admin', 'Support']);
  const [loadingPreview] = useState(false);

  const active = ADMINS.filter((a) => a.status === 'Active').length;
  const attention = ADMINS.filter((a) => a.status !== 'Active').length;
  const tfaOn = ADMINS.filter((a) => a.tfa).length;

  const filtered = ADMINS.filter(
    (a) =>
      (tab === 'All' || a.status === tab) &&
      (roleFilter === 'All roles' || a.roles.includes(roleFilter)) &&
      a.email.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const openMenu = (e: React.MouseEvent<HTMLElement>, admin: SampleAdmin) => {
    setSelected(admin);
    setMenuAnchor(e.currentTarget);
    if (admin.email === 'ines@mercato.com') setRoleSelection([...admin.roles]);
  };
  const closeMenu = () => setMenuAnchor(null);
  const openDialog = (kind: Exclude<DialogKind, null>) => {
    closeMenu();
    if (kind === 'create') setCreateStep(0);
    setDialog(kind);
  };
  const confirm = (message: string) => {
    setDialog(null);
    setToast(message);
  };

  const added = roleSelection.filter((r) => !selected.roles.includes(r));
  const removed = selected.roles.filter((r) => !roleSelection.includes(r));

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
          <MiniStat value={String(ADMINS.length)} label="Total admins" />
          <MiniStat value={String(active)} label="Active" />
          <MiniStat value={String(attention)} label="Needs attention" />
          <MiniStat value={`${tfaOn}/${ADMINS.length}`} label="2FA enabled" />
        </Box>
      </Paper>

      <TableCard
        title="Team members"
        subtitle={`${ADMINS.length} admins · ${attention} need attention · ${tfaOn} with 2FA — showing page 1 of 2`}
        toolbar={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              aria-label="Filter by status"
              sx={{ minHeight: 40 }}
            >
              {tabs.map((t) => (
                <Tab key={t} value={t} label={`${t} · ${t === 'All' ? ADMINS.length : ADMINS.filter((a) => a.status === t).length}`} sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
              ))}
            </Tabs>
            <Box sx={{ flex: 1 }} />
            <SearchField
              placeholder="Search loaded page…"
              aria-label="Text search over the loaded page"
              value={query}
              onChange={setQuery}
              minWidth={200}
            />
            <SelectField
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={['All roles', ...ALL_ROLES]}
              minWidth={150}
            />
          </Box>
        }
        footer={
          <>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
              Showing <b>1–5</b> of <b>8</b> admins
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" disabled>Previous</Button>
            <Button size="small" variant="contained" disabled>1</Button>
            <Button size="small" variant="outlined">2</Button>
            <Button size="small" variant="outlined">Next</Button>
          </>
        }
        empty={{
          when: !loadingPreview && filtered.length === 0,
          title: 'No admins match these filters',
          description: 'Try a different name, status tab, or role — or clear the search.',
          actionLabel: 'Clear filters',
          onAction: () => { setQuery(''); setTab('All'); setRoleFilter('All roles'); },
        }}
      >
        {loadingPreview ? (
          <Box sx={{ mt: 1.5 }}><DataLoader variant="skeleton" lines={4} label="Loading admins" /></Box>
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
                {filtered.map((a) => (
                  <TableRow
                    key={a.email}
                    hover
                    sx={a.you ? { bgcolor: mercatoTokens.brandSoft } : undefined}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {a.email}
                        {a.you ? (
                          <Chip label="YOU" size="small" sx={{ ml: 1, height: 20, fontSize: '0.66rem', bgcolor: 'primary.main', color: '#fff' }} />
                        ) : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{a.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={a.status} size="small" sx={{ bgcolor: statusTone[a.status].bg, color: statusTone[a.status].color }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {a.roles.map((r) => (
                          <Chip
                            key={r}
                            label={r}
                            size="small"
                            sx={r === 'Super Admin'
                              ? { bgcolor: mercatoTokens.brandSoft, color: mercatoTokens.brandStrong }
                              : { bgcolor: 'action.hover', color: 'text.secondary' }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: '0.84rem', fontWeight: 700, color: a.tfa ? 'success.main' : 'text.secondary' }}>
                        <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: a.tfa ? 'success.main' : 'divider' }} />
                        {a.tfa ? 'Enabled' : 'Not set'}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{a.created}</TableCell>
                    <TableCell align="right">
                      <IconButton aria-label={`Actions for ${a.email}`} aria-haspopup="menu" onClick={(e) => openMenu(e, a)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TableCard>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} aria-label="Row actions">
        <MenuItem onClick={() => openDialog('details')}><VisibilityIcon fontSize="small" style={{ marginRight: 8 }} />View details</MenuItem>
        <MenuItem onClick={() => openDialog('status')} disabled={selected.you} title={selected.you ? 'You cannot change your own status' : undefined}>
          Change status{selected.you ? ' (disabled — your own row)' : ''}
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
              <Button variant="contained" onClick={() => setCreateStep(1)}>Next: roles</Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => setCreateStep(0)}>Back</Button>
              <Box sx={{ flex: 1 }} />
              <Button variant="contained" onClick={() => confirm('Admin created — invitation sent (preview).')}>Create admin</Button>
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
              <FormField label="Work email" type="email" defaultValue="new-admin@mercato.com" error helperText="This email is already in use." />
              <Box>
                <FormField
                  label="Temporary password · min 12 characters"
                  type="password"
                  defaultValue="correct-horse-0427"
                  hint="Weak passwords are rejected — use the generator."
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => setToast('New temporary password generated (preview).')}>
                    Generate
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
                {ALL_ROLES.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    clickable
                    color={['Sub-Admin', 'Finance'].includes(r) ? 'primary' : 'default'}
                    variant={['Sub-Admin', 'Finance'].includes(r) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              {VIEWER_IS_SUPER_ADMIN ? (
                <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                  Signed in as Super Admin, so granting Super Admin is allowed. Everyone else sees that option hidden/disabled.
                </Typography>
              ) : null}
            </>
          )}
      </Modal>

      {/* 2. Admin Details (view) */}
      <Modal
        open={dialog === 'details'}
        onClose={() => setDialog(null)}
        title={selected.email}
        subtitle="Everything about this account on one screen. To change something, use the row menu."
        maxWidth="sm"
        actions={<Button onClick={() => setDialog(null)}>Close</Button>}
      >
        <Divider sx={{ my: 0 }} />
        <DetailRow label="Name">
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>{selected.name}</Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Status">
          <Chip label={selected.status} size="small" sx={{ bgcolor: statusTone[selected.status].bg, color: statusTone[selected.status].color }} />
        </DetailRow>
        <Divider />
        <DetailRow label={`Roles (${selected.roles.length})`}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.roles.map((r) => <Chip key={r} label={r} size="small" variant="outlined" />)}
          </Box>
        </DetailRow>
        <Divider />
        <DetailRow label="Two-factor">
          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: ADMINS.find((a) => a.email === selected.email)?.tfa ? 'success.main' : 'text.secondary' }}>
            {ADMINS.find((a) => a.email === selected.email)?.tfa ? 'Enabled' : 'Not set'}
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Created">
          <Typography sx={{ fontSize: '0.88rem' }}>{selected.created}</Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Recent activity">
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
            <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>
              Roles assigned by Aisha Rahman · Sep 18 — Signed in from 84.121.9.40 · Sep 21
            </Typography>
          </Box>
        </DetailRow>
      </Modal>

      {/* 3. Change Status (+ blocked variant for last Super Admin) */}
      <Modal
        open={dialog === 'status'}
        onClose={() => setDialog(null)}
        title={`Change status — ${selected.email}`}
        subtitle={selected.lastSuperAdmin ? 'Blocked: last Super Admin.' : 'Takes effect the moment you confirm.'}
        actions={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            {selected.lastSuperAdmin ? (
              <Button variant="contained" onClick={() => openDialog('roles')}>Manage roles instead</Button>
            ) : (
              <Button variant="contained" color="error" onClick={() => confirm(`Status change confirmed for ${selected.email} (preview).`)}>Confirm change</Button>
            )}
          </>
        }
      >
          {selected.lastSuperAdmin ? (
            <Alert severity="error">
              <b>Last active Super Admin.</b> Suspending or disabling this account would leave no active Super Admin.
              Assign the Super Admin role to someone else first.
            </Alert>
          ) : (
            <>
              <Alert severity="warning">
                <b>Blocked the moment you confirm.</b> Suspended and Disabled both stop sign-in immediately.
              </Alert>
              <RadioGroup defaultValue={selected.status} name="admin-status">
                <FormControlLabel value="Active" control={<Radio />} label="Active — can sign in and work normally." />
                <FormControlLabel value="Suspended" control={<Radio />} label="Suspended — blocks sign-in. Sessions held. Reversible." />
                <FormControlLabel value="Disabled" control={<Radio />} label="Disabled — blocks sign-in. Sessions revoked." />
              </RadioGroup>
              <FormField label="Reason / note (shows in the Activity Log)" multiline rows={2} placeholder="e.g. Failed KYC re-check" />
            </>
          )}
      </Modal>

      {/* 4. Manage Roles */}
      <Modal
        open={dialog === 'roles'}
        onClose={() => setDialog(null)}
        title={`Manage roles — ${selected.email}`}
        subtitle="Tick the roles they should have. At least one is required."
        actions={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={roleSelection.length === 0}
              onClick={() => confirm(`Roles updated for ${selected.email} (preview).`)}
            >
              Confirm role changes
            </Button>
          </>
        }
      >
          {ALL_ROLES.map((r) => {
            const lockedOwnSA = selected.you === true && r === 'Super Admin';
            const gatedSA = r === 'Super Admin' && !VIEWER_IS_SUPER_ADMIN;
            const checked = roleSelection.includes(r);
            return (
              <FormControlLabel
                key={r}
                control={
                  <Checkbox
                    checked={checked}
                    disabled={lockedOwnSA || gatedSA}
                    onChange={() => setRoleSelection((prev) => (checked ? prev.filter((x) => x !== r) : [...prev, r]))}
                  />
                }
                label={`${r}${lockedOwnSA ? ' (locked — your own role)' : ''}${gatedSA ? ' (Super-Admin-only grant)' : ''}`}
              />
            );
          })}
          {(added.length > 0 || removed.length > 0) && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Summary:{' '}
              {added.length > 0 ? <b>+ {added.join(', ')}</b> : null}
              {added.length > 0 && removed.length > 0 ? ' · ' : null}
              {removed.length > 0 ? <b>− {removed.join(', ')}</b> : null}
            </Alert>
          )}
      </Modal>

      {/* Revoke sessions confirm */}
      <ConfirmDialog
        open={dialog === 'revoke'}
        onClose={() => setDialog(null)}
        onConfirm={() => confirm(`Sessions revoked for ${selected.email} (preview).`)}
        title={`Revoke sessions — ${selected.email}?`}
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
        autoHideDuration={3200}
        onClose={() => setToast(null)}
        message={toast ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
