'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { DataLoader } from '@/components/ui/DataLoader';
import { mercatoTokens } from '@/lib/theme';

type AdminStatus = 'Active' | 'Suspended' | 'Disabled';

interface SampleAdmin {
  email: string;
  name: string;
  status: AdminStatus;
  roles: string[];
  tfa: boolean;
  created: string;
  you?: boolean;
  lastSuperAdmin?: boolean;
}

/** Static preview rows — replace with the admins API later. */
const ADMINS: SampleAdmin[] = [
  { email: 'aisha@mercato.com', name: 'Aisha Rahman', status: 'Active', roles: ['Super Admin'], tfa: true, created: 'Mar 2023', you: true },
  { email: 'marcus@mercato.com', name: 'Marcus Bell', status: 'Active', roles: ['Super Admin', 'Finance'], tfa: true, created: 'Jun 2023', lastSuperAdmin: true },
  { email: 'ines@mercato.com', name: 'Ines Duarte', status: 'Active', roles: ['Sub-Admin', 'Support'], tfa: false, created: 'Jan 2024' },
  { email: 'tomas@mercato.com', name: 'Tomás Rivera', status: 'Suspended', roles: ['Support'], tfa: true, created: 'Feb 2024' },
  { email: 'priya@mercato.com', name: 'Priya Nair', status: 'Disabled', roles: ['Finance'], tfa: false, created: 'Aug 2025' },
];

const ALL_ROLES = ['Super Admin', 'Sub-Admin', 'Support', 'Finance'];
/** Signed-in viewer is a Super Admin (see topbar chip). Non-Super-Admins never see the SA grant. */
const VIEWER_IS_SUPER_ADMIN = true;

const statusTone: Record<AdminStatus, { bg: string; color: string }> = {
  Active: { bg: mercatoTokens.goodSoft, color: mercatoTokens.good },
  Suspended: { bg: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong },
  Disabled: { bg: mercatoTokens.badSoft, color: mercatoTokens.bad },
};

const tabs: Array<'All' | AdminStatus> = ['All', 'Active', 'Suspended', 'Disabled'];

type DialogKind = null | 'create' | 'details' | 'status' | 'roles' | 'revoke';

export default function AdminsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [query, setQuery] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selected, setSelected] = useState<SampleAdmin>(ADMINS[2]);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [roleSelection, setRoleSelection] = useState<string[]>(['Sub-Admin', 'Support']);
  const [loadingPreview] = useState(false);

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
    setDialog(kind);
  };
  const confirm = (message: string) => {
    setDialog(null);
    setToast(message);
  };

  const added = roleSelection.filter((r) => !selected.roles.includes(r));
  const removed = selected.roles.filter((r) => !roleSelection.includes(r));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, my: 1.25, mb: 3 }}>
        <Box>
          <Typography variant="h1" component="h1">Admins</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: '46ch' }}>
            Create admin accounts, change statuses, and manage role assignments.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog('create')}>
          Create Admin
        </Button>
      </Box>

      <Paper component="section" aria-labelledby="admins-title">
        <Typography variant="h2" id="admins-title">Team members</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          8 admins · 1 suspended · 1 disabled — showing page 1 of 2
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="Filter by status"
            sx={{ minHeight: 40 }}
          >
            {tabs.map((t) => (
              <Tab key={t} value={t} label={t} sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }} />
            ))}
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <TextField
            size="small"
            type="search"
            placeholder="Search loaded page…"
            aria-label="Text search over the loaded page"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {['All roles', ...ALL_ROLES].map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>
        </Box>

        {loadingPreview ? (
          <Box sx={{ mt: 2 }}><DataLoader variant="skeleton" lines={4} label="Loading admins" /></Box>
        ) : filtered.length === 0 ? (
          <FallbackUI
            title="No admins match these filters"
            description="Try a different name, status tab, or role — or clear the search."
            actionLabel="Clear filters"
            onAction={() => { setQuery(''); setTab('All'); setRoleFilter('All roles'); }}
          />
        ) : (
          <TableContainer sx={{ mt: 2, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
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

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.86rem' }}>
            Showing <b>1–5</b> of <b>8</b> admins
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" disabled>Previous</Button>
          <Button size="small" variant="contained" disabled>1</Button>
          <Button size="small" variant="outlined">2</Button>
          <Button size="small" variant="outlined">Next</Button>
        </Box>
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} aria-label="Row actions">
        <MenuItem onClick={() => openDialog('details')}><VisibilityIcon fontSize="small" style={{ marginRight: 8 }} />View details</MenuItem>
        <MenuItem onClick={() => openDialog('status')} disabled={selected.you} title={selected.you ? 'You cannot change your own status' : undefined}>
          Change status{selected.you ? ' (disabled — your own row)' : ''}
        </MenuItem>
        <MenuItem onClick={() => openDialog('roles')}>Manage roles</MenuItem>
        <MenuItem onClick={() => openDialog('revoke')} sx={{ color: 'error.main' }}>Revoke sessions</MenuItem>
      </Menu>

      {/* 1. Create Admin */}
      <Dialog open={dialog === 'create'} onClose={() => setDialog(null)} aria-labelledby="create-title" maxWidth="xs" fullWidth>
        <DialogTitle id="create-title">Create Admin</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>
            The new admin signs in with this temporary password and sets their own afterwards.
          </Typography>
          <TextField label="Email" type="email" defaultValue="new-admin@mercato.com" fullWidth error helperText="This email is already in use." />
          <Box>
            <TextField
              label="Temporary password · min 12 characters"
              type={showPassword ? 'text' : 'password'}
              defaultValue="correct-horse-0427"
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" variant="outlined" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </Button>
              <Button size="small" variant="outlined" onClick={() => setToast('New temporary password generated (preview).')}>
                Generate
              </Button>
            </Box>
            <Typography color="text.secondary" sx={{ fontSize: '0.8rem', mt: 1 }}>
              Weak passwords are rejected — use the generator. At least one role is required.
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', mb: 1 }}>Roles</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
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
              <Typography color="text.secondary" sx={{ fontSize: '0.8rem', mt: 1 }}>
                Signed in as Super Admin, so granting Super Admin is allowed. Everyone else sees that option hidden/disabled.
              </Typography>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => confirm('Admin created — invitation sent (preview).')}>Create admin</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Admin Details (view) */}
      <Dialog open={dialog === 'details'} onClose={() => setDialog(null)} aria-labelledby="details-title" maxWidth="sm" fullWidth>
        <DialogTitle id="details-title">{selected.email}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
            <Chip label={selected.status} size="small" sx={{ bgcolor: statusTone[selected.status].bg, color: statusTone[selected.status].color }} />
            {selected.roles.map((r) => <Chip key={r} label={r} size="small" variant="outlined" />)}
          </Box>
          <Typography sx={{ fontSize: '0.9rem' }}>
            2FA: <b>{ADMINS.find((a) => a.email === selected.email)?.tfa ? 'Enabled' : 'Not set'}</b>
            {' · '}Created: <b>{selected.created}</b>
          </Typography>
          <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent activity</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem', mt: 0.5 }}>
              Roles assigned by Aisha Rahman · Sep 18 — Signed in from 84.121.9.40 · Sep 21
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 3. Change Status (+ blocked variant for last Super Admin) */}
      <Dialog open={dialog === 'status'} onClose={() => setDialog(null)} aria-labelledby="status-title" maxWidth="xs" fullWidth>
        <DialogTitle id="status-title">Change status — {selected.email}</DialogTitle>
        <DialogContent>
          {selected.lastSuperAdmin ? (
            <Alert severity="error" sx={{ mb: 1 }}>
              <b>Last active Super Admin.</b> Suspending or disabling this account would leave no active Super Admin.
              Assign the Super Admin role to someone else first.
            </Alert>
          ) : (
            <>
              <Typography color="text.secondary" sx={{ fontSize: '0.88rem', mb: 1.5 }}>
                Suspended and Disabled both block sign-in immediately.
              </Typography>
              <RadioGroup defaultValue={selected.status} name="admin-status">
                <FormControlLabel value="Active" control={<Radio />} label="Active — can sign in and work normally." />
                <FormControlLabel value="Suspended" control={<Radio />} label="Suspended — blocks sign-in. Sessions held. Reversible." />
                <FormControlLabel value="Disabled" control={<Radio />} label="Disabled — blocks sign-in. Sessions revoked." />
              </RadioGroup>
              <TextField label="Reason / note (optional)" multiline rows={2} fullWidth sx={{ mt: 1.5 }} placeholder="e.g. Failed KYC re-check" />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          {selected.lastSuperAdmin ? (
            <Button variant="contained" onClick={() => openDialog('roles')}>Manage roles instead</Button>
          ) : (
            <Button variant="contained" color="error" onClick={() => confirm(`Status change confirmed for ${selected.email} (preview).`)}>Confirm change</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 4. Manage Roles */}
      <Dialog open={dialog === 'roles'} onClose={() => setDialog(null)} aria-labelledby="roles-title" maxWidth="xs" fullWidth>
        <DialogTitle id="roles-title">Manage roles — {selected.email}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem', mb: 1 }}>
            At least one role is required.
          </Typography>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={roleSelection.length === 0}
            onClick={() => confirm(`Roles updated for ${selected.email} (preview).`)}
          >
            Confirm role changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke sessions confirm */}
      <Dialog open={dialog === 'revoke'} onClose={() => setDialog(null)} aria-labelledby="revoke-title" maxWidth="xs" fullWidth>
        <DialogTitle id="revoke-title">Revoke sessions — {selected.email}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            All active sessions for this admin will be signed out immediately. They will need to sign in again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => confirm(`Sessions revoked for ${selected.email} (preview).`)}>Revoke sessions</Button>
        </DialogActions>
      </Dialog>

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
