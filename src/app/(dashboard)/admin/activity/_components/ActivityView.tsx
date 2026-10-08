'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
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
import { DataLoader } from '@/components/ui/DataLoader';
import { DetailRow, GuideAccordion, HowRow } from '@/components/ui/Guide';
import { RbacGuard } from '@/components/auth/RbacGuard';
import {
  DateTimeField,
  SearchField,
  SelectField,
  TableCard,
} from '@/components/ui/controls';
import { mercatoTokens } from '@/lib/theme';
import { formatDay, useResetKey } from '@/lib/utils';
import { normaliseApiError } from '@/types/api';
import type { ActionOption, ActivityEntry } from '@/types/activity';
import { useActivityActionsQuery, useListActivityQuery } from '@/services/activityApi';

const PAGE_SIZE = 20;

/** "Showing 1–20 of 128" bounds for the footer. */
function rangeLabel(page: number, limit: number, total: number, loaded: number): string {
  if (total === 0) return '0';
  const from = (page - 1) * limit + 1;
  return `${from}–${from + loaded - 1}`;
}

/** Compact page window around the current page (max 5 numbers). */
function pageWindow(current: number, totalPages: number): number[] {
  const lo = Math.max(1, Math.min(current - 2, totalPages - 4));
  const hi = Math.min(totalPages, lo + 4);
  const out: number[] = [];
  for (let p = lo; p <= hi; p += 1) out.push(p);
  return out;
}

/**
 * Dropdown options from the `actions` endpoint. The catalog reuses human
 * labels across keys (three 'Role updated' / 'Roles' rows), so a repeated
 * label + category pair gets its machine key appended — the value sent
 * back as `?action=` stays unambiguous.
 */
function actionOptions(actions: ActionOption[] | undefined, rows: ActivityEntry[]) {
  if (actions?.length) {
    const seen = new Map<string, number>();
    for (const a of actions) {
      seen.set(`${a.label}|${a.category}`, (seen.get(`${a.label}|${a.category}`) ?? 0) + 1);
    }
    return actions.map((a) => {
      const dup = (seen.get(`${a.label}|${a.category}`) ?? 0) > 1;
      return {
        value: a.action,
        label: `${a.label} — ${a.category} · ${a.count}${dup ? ` (${a.action})` : ''}`,
      };
    });
  }
  // Fallback when the options query fails: distinct keys from loaded rows.
  const distinct = new Map<string, ActivityEntry>();
  for (const r of rows) if (!distinct.has(r.action)) distinct.set(r.action, r);
  return [...distinct.values()].map((r) => ({ value: r.action, label: r.actionLabel }));
}

export function ActivityView() {
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);
  // Page resets on any filter change (render-phase reset, not an effect).
  useResetKey(`${action}|${debounced}|${from}|${to}`, () => setPage(1));

  const dateError = from !== '' && to !== '' && from > to;
  const filtersActive = action !== '' || debounced !== '' || from !== '' || to !== '';
  const clearFilters = () => {
    setAction('');
    setQuery('');
    setDebounced('');
    setFrom('');
    setTo('');
  };

  const listArgs = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      action: action || undefined,
      q: debounced || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [page, action, debounced, from, to],
  );
  const {
    data: listRes,
    isLoading: listLoading,
    isFetching: listFetching,
    isError: listError,
    error: listErrorBody,
    refetch: refetchList,
  } = useListActivityQuery(listArgs, { skip: dateError });

  const actionsArgs = useMemo(
    () => ({ q: debounced || undefined, from: from || undefined, to: to || undefined }),
    [debounced, from, to],
  );
  const { data: actionsRes } = useActivityActionsQuery(actionsArgs, { skip: dateError });

  // Unfiltered total for the "Total events" cell (the list total already
  // covers it when no filter is active — skip the extra request then).
  const { data: totalRes } = useListActivityQuery(
    { page: 1, limit: 1 },
    { skip: !filtersActive || dateError },
  );

  const rows = useMemo(() => listRes?.data ?? [], [listRes]);
  const pagination = listRes?.pagination;
  const matching = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const totalEvents = filtersActive ? (totalRes?.pagination.total ?? null) : matching;

  const options = useMemo(() => actionOptions(actionsRes?.data, rows), [actionsRes, rows]);
  const topChips = useMemo(
    () => [...(actionsRes?.data ?? [])].sort((a, b) => b.count - a.count).slice(0, 3),
    [actionsRes],
  );

  const listMessage = dateError
    ? 'Invalid date range'
    : normaliseApiError(listErrorBody).message;
  const emptyTitle = dateError
    ? 'Invalid date range'
    : 'No events match these filters';
  const emptyDescription = dateError
    ? 'The From day must not be after the To day — adjust the range.'
    : filtersActive
      ? 'Try widening the date range or clearing the search.'
      : 'Admin actions — creates, status changes, role grants — will appear here.';
  const showLoading = listLoading && rows.length === 0;
  const showError = !dateError && listError && rows.length === 0;

  return (
    <RbacGuard perm="audit.read">
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Compact header */}
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="h1" component="h1">Activity Log</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
          Who changed what, when, and from where — the audit trail for this console.
        </Typography>
        <GuideAccordion title="What is the activity log?">
          <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary' }}>
            What it is: a permanent, append-only record of every change made through this
            console. Entries can never be edited or deleted — renaming an admin or role
            never rewrites history.
          </Typography>
          <HowRow n={1}>Filter by action type, free-text search, or day range to narrow the trail.</HowRow>
          <HowRow n={2}>Expand any row to see the before / after field changes for that event.</HowRow>
          <HowRow n={3}>Quote the request ID (shown in the expanded row) when reporting a problem.</HowRow>
        </GuideAccordion>
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
              {totalEvents ?? '…'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Total events
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
              {dateError ? '—' : matching}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Matching filters
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {topChips.map((a) => (
              <Chip
                key={a.action}
                label={`${a.label} · ${a.count}`}
                size="small"
                variant="outlined"
                title={`${a.category} — ${a.action}`}
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
      </Paper>

      <TableCard
        title="Events"
        subtitle={
          dateError
            ? 'The From day must not be after the To day.'
            : filtersActive
              ? `${matching} event${matching === 1 ? '' : 's'} match — expand a row for before/after detail.${listFetching ? ' Updating…' : ''}`
              : `Newest first — expand a row for the before/after change detail.${listFetching ? ' Updating…' : ''}`
        }
        actions={filtersActive ? <Button size="small" variant="outlined" onClick={clearFilters}>Clear filters</Button> : undefined}
        toolbar={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }} role="search" aria-label="Filter activity">
            <SelectField
              label="Action type"
              value={action}
              onChange={(v) => setAction(v)}
              options={options}
              placeholder="All actions"
              minWidth={220}
            />
            <SearchField value={query} onChange={setQuery} placeholder="Name, email or IP…" aria-label="Free-text search" minWidth={200} />
            <DateTimeField mode="date" label="From" value={from} onChange={setFrom} />
            <DateTimeField mode="date" label="To" value={to} onChange={setTo} />
          </Box>
        }
        footer={
          <>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
              Showing <b>{rangeLabel(page, pagination?.limit ?? PAGE_SIZE, matching, rows.length)}</b> of <b>{matching}</b> events
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              disabled={page <= 1 || listLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              Previous
            </Button>
            {pageWindow(page, totalPages).map((p) => (
              <Button
                key={p}
                size="small"
                variant={p === page ? 'contained' : 'outlined'}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              size="small"
              variant="outlined"
              disabled={page >= totalPages || listLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              Next
            </Button>
          </>
        }
        empty={{
          when: dateError || (!showLoading && !showError && rows.length === 0),
          title: filtersActive || dateError ? emptyTitle : 'No activity yet',
          description: filtersActive || dateError ? emptyDescription : 'Admin actions — creates, status changes, role grants — will appear here.',
          actionLabel: dateError || filtersActive ? 'Clear filters' : undefined,
          onAction: dateError || filtersActive ? clearFilters : undefined,
        }}
      >
        {showLoading ? (
          <DataLoader label="Loading activity" variant="skeleton" lines={4} />
        ) : showError ? (
          <FallbackUI
            tone="error"
            title="Could not load activity"
            description={listMessage}
            actionLabel="Retry"
            onAction={() => refetchList()}
          />
        ) : (
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
                {rows.map((e) => {
                  const open = expanded === e.id;
                  return (
                    <Fragment key={e.id}>
                      <TableRow hover selected={open} sx={{ '& > td': { borderBottom: open ? 'none' : undefined } }}>
                        <TableCell>
                          <IconButton
                            size="small"
                            aria-label={open ? `Collapse details for ${e.actionLabel}` : `Expand details for ${e.actionLabel}`}
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : e.id)}
                            sx={{
                              transform: open ? 'rotate(180deg)' : undefined,
                              transition: 'transform 200ms',
                            }}
                          >
                            <ExpandMoreIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDay(e.timestamp)}</TableCell>
                        <TableCell>
                          <Chip label={e.actionLabel} size="small" variant="outlined" title={e.action} />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {e.category}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ overflowWrap: 'anywhere' }}>
                          {e.resource.label}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem' }}>
                            {e.resource.type} · {e.resource.id}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ overflowWrap: 'anywhere' }}>
                          {e.actor.name}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {e.actor.email}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}>
                          {e.ip || '—'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 1.5, pl: { xs: 0, sm: 5 } }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }}>
                                Before / after · {e.changes.length} field{e.changes.length === 1 ? '' : 's'} changed
                              </Typography>
                              {e.changes.length === 0 ? (
                                <Typography color="text.secondary" sx={{ fontSize: '0.82rem', mt: 0.5 }}>
                                  No field changes recorded
                                </Typography>
                              ) : (
                                <Table size="small" aria-label={`Change detail for ${e.actionLabel}`}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Field</TableCell>
                                      <TableCell>Before</TableCell>
                                      <TableCell>After</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {e.changes.map((c) => (
                                      <TableRow key={c.field}>
                                        <TableCell sx={{ fontWeight: 600, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>{c.field}</TableCell>
                                        <TableCell>
                                          <Box
                                            component="span"
                                            sx={{ bgcolor: mercatoTokens.badSoft, color: mercatoTokens.bad, px: 0.75, py: 0.25, borderRadius: 1.5, overflowWrap: 'anywhere' }}
                                          >
                                            {c.before}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            component="span"
                                            sx={{ bgcolor: mercatoTokens.goodSoft, color: mercatoTokens.good, px: 0.75, py: 0.25, borderRadius: 1.5, overflowWrap: 'anywhere' }}
                                          >
                                            {c.after}
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                              <Divider sx={{ my: 1 }} />
                              <DetailRow label="Category">
                                <Typography sx={{ fontSize: '0.84rem' }}>
                                  {e.category} · <Typography component="span" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem' }}>{e.action}</Typography>
                                </Typography>
                              </DetailRow>
                              <DetailRow label="Request ID">
                                <Typography sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', overflowWrap: 'anywhere' }}>
                                  {e.requestId}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Quote this ID when reporting a problem — it links this row to the request logs.
                                </Typography>
                              </DetailRow>
                              {e.userAgent ? (
                                <DetailRow label="User agent">
                                  <Typography sx={{ fontSize: '0.8rem', overflowWrap: 'anywhere' }}>
                                    {e.userAgent}
                                  </Typography>
                                </DetailRow>
                              ) : null}
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
      </TableCard>
    </Box>
    </RbacGuard>
  );
}
