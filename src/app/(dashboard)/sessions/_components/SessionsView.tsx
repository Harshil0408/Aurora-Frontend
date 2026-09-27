'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LogoutIcon from '@mui/icons-material/Logout';
import DevicesIcon from '@mui/icons-material/Devices';
import { useLogoutAllMutation, useRevokeSessionMutation, useSessionsQuery } from '@/services/authApi';
import { useAppDispatch } from '@/store/hooks';
import { clearAuth } from '@/store/authSlice';
import { normaliseApiError } from '@/types/api';
import type { AuthSession } from '@/types/auth';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { ConfirmDialog, TableCard } from '@/components/ui/controls';
import { mercatoTokens } from '@/lib/theme';

type DialogKind = null | 'revoke-one' | 'revoke-all';

function isMobileUA(ua: string | null): boolean {
  return ua != null && /mobile|android|iphone|ipad/i.test(ua);
}

function shortUA(ua: string | null): string {
  if (!ua) return 'Unknown device';
  if (ua.length <= 64) return ua;
  return `${ua.slice(0, 61)}…`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return iso;
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

function fullDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionsView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSessionsQuery({ page: 1, limit: 20 });
  const [revokeOne, { isLoading: revoking }] = useRevokeSessionMutation();
  const [logoutAll, { isLoading: loggingOut }] = useLogoutAllMutation();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [target, setTarget] = useState<AuthSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <DataLoader label="Loading sessions" />;
  if (isError || !data) {
    return <FallbackUI title="Could not load sessions" description="Check your connection and retry." tone="error" actionLabel="Retry" onAction={() => refetch()} />;
  }

  const sessions = data.data;
  const current = sessions.find((s) => s.current);
  const others = sessions.length - (current ? 1 : 0);

  const askOne = (s: AuthSession) => {
    setTarget(s);
    setError(null);
    setDialog('revoke-one');
  };
  const askAll = () => {
    setError(null);
    setDialog('revoke-all');
  };
  const done = (message: string) => {
    setDialog(null);
    setTarget(null);
    setToast(message);
  };

  const confirmOne = async () => {
    if (!target) return;
    setError(null);
    try {
      await revokeOne({ id: target.id }).unwrap();
      if (target.current) {
        dispatch(clearAuth());
        router.replace('/login');
        return;
      }
      done(`Session revoked${target.ipAddress ? `: ${target.ipAddress}` : ''}.`);
    } catch (err) {
      const n = normaliseApiError({ status: (err as { status?: number })?.status, data: (err as { data?: unknown })?.data });
      setError(n.code === 'RATE_LIMITED' ? 'Too many attempts. Try again shortly.' : 'Could not revoke that session.');
    }
  };

  const confirmAll = async () => {
    setError(null);
    try {
      await logoutAll().unwrap();
      dispatch(clearAuth());
      router.replace('/login');
    } catch (err) {
      const n = normaliseApiError({ status: (err as { status?: number })?.status, data: (err as { data?: unknown })?.data });
      setError(n.message || 'Could not revoke all sessions.');
    }
  };

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
          <Typography variant="h1" component="h1">Sessions</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
            Every browser and device signed in as you — revoke one, or all at once.
          </Typography>
        </Box>
        <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={askAll}>
          Log out everywhere
        </Button>
      </Box>

      {/* Sessions summary strip */}
      <Paper component="section" aria-label="Sessions summary" sx={{ py: 1.5, px: 2 }}>
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
            <DevicesIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
              {sessions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Active sessions
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
              {others}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Other devices
            </Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              This device: {current ? shortUA(current.userAgent) : 'unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {current ? `Last active ${timeAgo(current.lastUsedAt)} · ${current.ipAddress ?? 'unknown IP'}` : 'Current session not identified'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <TableCard
        title="My sessions"
        subtitle={`${sessions.length} active · ${others} on other devices — newest activity first`}
        actions={
          <Button size="small" variant="outlined" color="error" onClick={askAll}>
            Revoke all others
          </Button>
        }
        empty={{
          when: sessions.length === 0,
          title: 'No other sessions',
          description: 'Only this device is signed in. If you expected more devices, nothing is wrong — they may simply have expired.',
        }}
      >
        <TableContainer sx={{ mt: 1.5, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
          <Table aria-label="My sessions" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Device / browser</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Signed in</TableCell>
                <TableCell>Last active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((s) => {
                const mobile = isMobileUA(s.userAgent);
                return (
                  <TableRow
                    key={s.id}
                    hover
                    sx={s.current ? { outline: `2px solid ${mercatoTokens.good}`, outlineOffset: -2, borderRadius: 3 } : undefined}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          aria-hidden
                          sx={{
                            display: 'grid', placeItems: 'center', width: 40, height: 40,
                            borderRadius: 3, bgcolor: 'action.hover', border: 1, borderColor: 'divider', color: 'text.secondary',
                          }}
                        >
                          {mobile ? <SmartphoneIcon fontSize="small" /> : <ComputerIcon fontSize="small" />}
                        </Box>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>
                            {shortUA(s.userAgent)}
                            {s.current ? (
                              <Chip label="Current session" size="small" sx={{ ml: 1, height: 22, fontSize: '0.68rem', bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }} />
                            ) : null}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Last active {timeAgo(s.lastUsedAt)}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}>{s.ipAddress ?? '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}>{fullDate(s.createdAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{timeAgo(s.lastUsedAt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" color="error" onClick={() => askOne(s)}>
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TableCard>

      {/* Revoke one session */}
      <ConfirmDialog
        open={dialog === 'revoke-one'}
        onClose={() => setDialog(null)}
        onConfirm={confirmOne}
        title="Revoke this session?"
        consequence={
          <>
            <b>{target ? `${shortUA(target.userAgent)} · ${target.ipAddress ?? 'unknown IP'}` : 'This session'}</b> will
            be signed out immediately and must sign in again.
            {target?.current ? (
              <> <b>This is your current session</b> — you will land back on the sign-in screen.</>
            ) : null}
          </>
        }
        ackLabel={target?.current ? 'I understand I will be signed out' : undefined}
        confirmLabel="Revoke session"
        loading={revoking}
        error={error}
      />

      {/* Revoke all others / log out everywhere */}
      <ConfirmDialog
        open={dialog === 'revoke-all'}
        onClose={() => setDialog(null)}
        onConfirm={confirmAll}
        title="Log out everywhere?"
        consequence={
          <>
            <b>Strong confirm.</b> This revokes <b>all {sessions.length} sessions</b>, including this one.
            Every device will need to sign in again.
          </>
        }
        ackLabel="Step 1 — I understand all devices will be signed out"
        confirmWord="LOGOUT"
        confirmLabel="Revoke all sessions"
        workingLabel="Revoking"
        loading={loggingOut}
        error={error}
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
