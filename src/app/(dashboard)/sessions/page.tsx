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
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LogoutIcon from '@mui/icons-material/Logout';
import { mercatoTokens } from '@/lib/theme';

interface SampleSession {
  id: string;
  device: string;
  browser: string;
  mobile: boolean;
  ip: string;
  location: string;
  lastActive: string;
  current?: boolean;
}

/** Static preview rows — replace with the sessions API later. */
const SESSIONS: SampleSession[] = [
  { id: 's1', device: 'MacBook Pro · macOS', browser: 'Chrome 126', mobile: false, ip: '84.121.9.40', location: 'Lisbon, PT', lastActive: 'Now', current: true },
  { id: 's2', device: 'iPhone 15 · iOS 18', browser: 'Safari Mobile', mobile: true, ip: '84.121.9.40', location: 'Lisbon, PT', lastActive: '12 min ago' },
  { id: 's3', device: 'ThinkPad · Windows 11', browser: 'Edge 126', mobile: false, ip: '85.241.17.9', location: 'Porto, PT', lastActive: '2 h ago' },
  { id: 's4', device: 'iPad Air · iPadOS 18', browser: 'Safari', mobile: true, ip: '84.121.9.40', location: 'Lisbon, PT', lastActive: 'Yesterday' },
];

type DialogKind = null | 'revoke-one' | 'revoke-all';

export default function SessionsPage() {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [target, setTarget] = useState<SampleSession>(SESSIONS[1]);
  const [ackCurrent, setAckCurrent] = useState(false);
  const [ackAll, setAckAll] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const askOne = (s: SampleSession) => {
    setTarget(s);
    setAckCurrent(false);
    setDialog('revoke-one');
  };
  const askAll = () => {
    setAckAll(false);
    setConfirmText('');
    setDialog('revoke-all');
  };
  const done = (message: string) => {
    setDialog(null);
    setToast(message);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, my: 1.25, mb: 3 }}>
        <Box>
          <Typography variant="h1" component="h1">Sessions</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: '48ch' }}>
            Your active sign-ins on this admin account. Revoking the current session signs you out.
          </Typography>
        </Box>
        <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={askAll}>
          Log out everywhere
        </Button>
      </Box>

      <Paper component="section" aria-labelledby="sessions-title">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Box>
            <Typography variant="h2" id="sessions-title">My sessions</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
              {SESSIONS.length} active sessions
            </Typography>
          </Box>
          <Button size="small" variant="outlined" color="error" onClick={askAll}>
            Revoke all others
          </Button>
        </Box>

        <TableContainer sx={{ mt: 2, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
          <Table aria-label="My sessions" sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Device / browser</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Last active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SESSIONS.map((s) => (
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
                        {s.mobile ? <SmartphoneIcon fontSize="small" /> : <ComputerIcon fontSize="small" />}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {s.device}
                          {s.current ? (
                            <Chip label="Current session" size="small" sx={{ ml: 1, height: 22, fontSize: '0.68rem', bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good }} />
                          ) : null}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{s.browser} · {s.location}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}>{s.ip}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{s.lastActive}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" color="error" onClick={() => askOne(s)}>
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Revoke one session */}
      <Dialog open={dialog === 'revoke-one'} onClose={() => setDialog(null)} aria-labelledby="ro-title" maxWidth="xs" fullWidth>
        <DialogTitle id="ro-title">Revoke this session?</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
            {target.device} · {target.browser} · {target.ip} will be signed out immediately.
          </Typography>
          {target.current ? (
            <Alert severity="warning">
              <b>This is your current session.</b> Revoking it signs you out — you will need to sign in again.
            </Alert>
          ) : null}
          {target.current ? (
            <FormControlLabel
              control={<Checkbox checked={ackCurrent} onChange={(e) => setAckCurrent(e.target.checked)} />}
              label="I understand I will be signed out"
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={target.current === true && !ackCurrent}
            onClick={() => done(target.current ? 'Current session revoked — you would be signed out (preview).' : `Session revoked: ${target.device} (preview).`)}
          >
            Revoke session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke all others / log out everywhere */}
      <Dialog open={dialog === 'revoke-all'} onClose={() => setDialog(null)} aria-labelledby="ra-title" maxWidth="xs" fullWidth>
        <DialogTitle id="ra-title">Log out everywhere?</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Alert severity="error">
            <b>Strong confirm.</b> This revokes <b>all {SESSIONS.length} sessions</b>, including this one.
            Every device will need to sign in again.
          </Alert>
          <FormControlLabel
            control={<Checkbox checked={ackAll} onChange={(e) => setAckAll(e.target.checked)} />}
            label="I understand all devices will be signed out"
          />
          <TextField
            label='Type LOGOUT to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            fullWidth
            placeholder="LOGOUT"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!ackAll || confirmText.trim() !== 'LOGOUT'}
            onClick={() => done('All sessions revoked — you would be signed out (preview).')}
          >
            Revoke all sessions
          </Button>
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
