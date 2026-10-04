'use client';

import { Fragment, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { RbacGuard } from '@/components/auth/RbacGuard';
import {
  DateTimeField,
  SearchField,
  SelectField,
  TableCard,
} from '@/components/ui/controls';
import { mercatoTokens } from '@/lib/theme';
import { ACTION_TYPES, LOGS } from '@/lib/variables';

export function ActivityView() {
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
  const typeCount = (t: string) => LOGS.filter((l) => l.actionType === t).length;

  return (
    <RbacGuard perm="audit.read">
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Compact header */}
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="h1" component="h1">Activity Log</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
          Who changed what, when, and from where — the audit trail for this console.
        </Typography>
      </Box>

      {/* Log summary strip */}
      <Paper component="section" aria-label="Log summary" sx={{ py: 1.5, px: 2 }}>
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
            <HistoryIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
              128
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Total events
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
              {filtered.length}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Matching filters
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {ACTION_TYPES.slice(1, 4).map((t) => (
              <Chip key={t} label={`${t} · ${typeCount(t)}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            ))}
          </Box>
        </Box>
      </Paper>

      {LOGS.length === 0 ? (
          <FallbackUI title="No activity yet" description="Admin actions — creates, status changes, role grants — will appear here." />
        ) : (
          <TableCard
            title="Events"
            subtitle={
              filtersActive
                ? `${filtered.length} of ${LOGS.length} loaded events match — expand a row for before/after detail.`
                : 'Newest first — expand a row for the before/after change detail.'
            }
            actions={filtersActive ? <Button size="small" variant="outlined" onClick={clearFilters}>Clear filters</Button> : undefined}
            toolbar={
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }} role="search" aria-label="Filter activity">
                <SelectField label="Action type" value={actionType} onChange={setActionType} options={ACTION_TYPES} minWidth={180} />
                <SearchField value={query} onChange={setQuery} placeholder="Name, email or IP…" aria-label="Free-text search" minWidth={200} />
                <DateTimeField mode="date" label="From" value={from} onChange={setFrom} />
                <DateTimeField mode="date" label="To" value={to} onChange={setTo} />
              </Box>
            }
            footer={
              <>
                <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
                  Showing <b>1–5</b> of <b>128</b> events
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="outlined" disabled>Previous</Button>
                <Button size="small" variant="contained" disabled>1</Button>
                <Button size="small" variant="outlined">2</Button>
                <Button size="small" variant="outlined">Next</Button>
              </>
            }
            empty={{
              when: filtered.length === 0,
              title: 'No events match these filters',
              description: 'Try widening the date range or clearing the search.',
              actionLabel: 'Clear filters',
              onAction: clearFilters,
            }}
          >
            <TableContainer sx={{ mt: 1.5, overflowX: 'auto', boxShadow: 'none', border: 'none' }}>
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
                                <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }}>
                                  Before / after · {l.changes.length} field{l.changes.length === 1 ? '' : 's'} changed
                                </Typography>
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
                                        <TableCell sx={{ fontWeight: 600, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>{c.field}</TableCell>
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
          </TableCard>
        )}
    </Box>
    </RbacGuard>
  );
}
