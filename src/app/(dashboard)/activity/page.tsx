'use client';

import { Fragment, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { FallbackUI } from '@/components/ui/FallbackUI';

interface LogEntry {
  id: number;
  timestamp: string;
  action: string;
  actionType: string;
  resource: string;
  actor: string;
  ip: string;
  changes: Array<{ field: string; before: string; after: string }>;
}

/** Static preview rows — replace with the activity API later. */
const LOGS: LogEntry[] = [
  {
    id: 1, timestamp: 'Sep 21, 2026 · 14:02', action: 'Roles assigned', actionType: 'Roles assigned',
    resource: 'ines@mercato.com', actor: 'aisha@mercato.com', ip: '84.121.9.40',
    changes: [{ field: 'roles', before: 'Sub-Admin', after: 'Sub-Admin, Support' }],
  },
  {
    id: 2, timestamp: 'Sep 20, 2026 · 18:44', action: 'Status changed', actionType: 'Status changed',
    resource: 'tomas@mercato.com', actor: 'marcus@mercato.com', ip: '84.121.9.41',
    changes: [{ field: 'status', before: 'Active', after: 'Suspended' }, { field: 'reason', before: '—', after: 'Failed KYC re-check' }],
  },
  {
    id: 3, timestamp: 'Sep 19, 2026 · 09:15', action: 'Role created', actionType: 'Role created',
    resource: 'finance', actor: 'aisha@mercato.com', ip: '84.121.9.40',
    changes: [{ field: 'permissions', before: '—', after: '0 (assign now)' }],
  },
  {
    id: 4, timestamp: 'Sep 18, 2026 · 11:30', action: 'Admin created', actionType: 'Admin created',
    resource: 'priya@mercato.com', actor: 'aisha@mercato.com', ip: '84.121.9.40',
    changes: [{ field: 'roles', before: '—', after: 'Finance' }],
  },
  {
    id: 5, timestamp: 'Sep 17, 2026 · 16:05', action: 'Role updated', actionType: 'Role updated',
    resource: 'support', actor: 'marcus@mercato.com', ip: '84.121.9.41',
    changes: [{ field: 'sessions.revoke', before: 'denied', after: 'allowed' }],
  },
];

const ACTION_TYPES = ['All actions', 'Admin created', 'Status changed', 'Roles assigned', 'Role created', 'Role updated'];

export default function ActivityPage() {
  const [actionType, setActionType] = useState('All actions');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<number | null>(1);

  const filtersActive = actionType !== 'All actions' || query.trim() !== '' || from !== '' || to !== '';
  const filtered = LOGS.filter(
    (l) =>
      (actionType === 'All actions' || l.actionType === actionType) &&
      `${l.action} ${l.resource} ${l.actor} ${l.ip}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const clearFilters = () => { setActionType('All actions'); setQuery(''); setFrom(''); setTo(''); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ my: 1.25, mb: 3 }}>
        <Typography variant="h1" component="h1">Activity Log</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: '48ch' }}>
          Who changed what, when, and from where. Filters apply to the loaded data.
        </Typography>
      </Box>

      <Paper component="section" aria-labelledby="log-title">
        <Typography variant="h2" id="log-title">Events</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          Expand a row for the before/after change detail.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 2 }} role="search" aria-label="Filter activity">
          <TextField size="small" select label="Action type" value={actionType} onChange={(e) => setActionType(e.target.value)} sx={{ minWidth: 180 }}>
            {ACTION_TYPES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </TextField>
          <TextField size="small" type="search" placeholder="Free-text search…" aria-label="Free-text search" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ minWidth: 200 }} />
          <TextField size="small" type="date" label="From" slotProps={{ inputLabel: { shrink: true } }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField size="small" type="date" label="To" slotProps={{ inputLabel: { shrink: true } }} value={to} onChange={(e) => setTo(e.target.value)} />
          {filtersActive ? <Button size="small" variant="outlined" onClick={clearFilters}>Clear filters</Button> : null}
        </Box>

        {LOGS.length === 0 ? (
          <FallbackUI title="No activity yet" description="Admin actions — creates, status changes, role grants — will appear here." />
        ) : filtered.length === 0 ? (
          <FallbackUI
            title="No events match these filters"
            description="Try widening the date range or clearing the search."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <TableContainer sx={{ mt: 2, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
            <Table aria-label="Activity log" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>IP address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((l) => {
                  const open = expanded === l.id;
                  return (
                    <Fragment key={l.id}>
                      <TableRow hover selected={open} sx={{ '& > td': { borderBottom: open ? 'none' : undefined } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            aria-label={open ? `Collapse details for ${l.action}` : `Expand details for ${l.action}`}
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : l.id)}
                            sx={{ transform: open ? 'rotate(180deg)' : undefined }}
                          >
                            <ExpandMoreIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.timestamp}</TableCell>
                        <TableCell><Chip label={l.action} size="small" variant="outlined" /></TableCell>
                        <TableCell sx={{ overflowWrap: 'anywhere' }}>{l.resource}</TableCell>
                        <TableCell sx={{ overflowWrap: 'anywhere' }}>{l.actor}</TableCell>
                        <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}>{l.ip}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 1.5, pl: 5 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }}>Before / after</Typography>
                              <Table size="small" aria-label={`Change detail for ${l.action}`}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Field</TableCell>
                                    <TableCell>Before</TableCell>
                                    <TableCell>After</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {l.changes.map((c) => (
                                    <TableRow key={c.field}>
                                      <TableCell sx={{ fontWeight: 600 }}>{c.field}</TableCell>
                                      <TableCell><Box component="span" sx={{ bgcolor: 'error.light', px: 0.75, py: 0.25, borderRadius: 1.5 }}>{c.before}</Box></TableCell>
                                      <TableCell><Box component="span" sx={{ bgcolor: 'success.light', px: 0.75, py: 0.25, borderRadius: 1.5 }}>{c.after}</Box></TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography color="text.secondary" sx={{ fontSize: '0.86rem' }}>
            Showing <b>1–5</b> of <b>128</b> events
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" disabled>Previous</Button>
          <Button size="small" variant="contained" disabled>1</Button>
          <Button size="small" variant="outlined">2</Button>
          <Button size="small" variant="outlined">Next</Button>
        </Box>
      </Paper>
    </Box>
  );
}
