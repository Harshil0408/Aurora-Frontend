'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { SearchField, SelectField, TableCard } from '@/components/ui/controls';
import { DataLoader } from '@/components/ui/DataLoader';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { useSellerAuditQuery } from '@/services/sellerBillingApi';
import { SellerForbidden, useSellerCan } from '@/components/seller/SellerGuards';
import { normaliseApiError } from '@/types/api';

const KNOWN_ACTIONS = [
  'store.created',
  'store.updated',
  'store.onboarding_completed',
  'staff.invited',
  'staff.invite_revoked',
  'staff.invite_declined',
  'staff.joined',
  'staff.role_changed',
  'staff.removed',
  'role.created',
  'role.updated',
  'role.permissions_updated',
  'role.deleted',
];

export function ActivityView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useSellerAuditQuery(
    { storeId, page, limit: 20, action: action || undefined },
    { skip: !storeId || !can('store:read') },
  );

  if (!can('store:read')) return <Box sx={{ mt: 0.5 }}><SellerForbidden /></Box>;
  if (isLoading) return <DataLoader label="Loading activity" variant="skeleton" />;
  if (isError) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => refetch()}>Retry</Button>}>
        Couldn&apos;t load activity — {normaliseApiError(error as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  const rows = (data?.data ?? []).filter((r) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      r.action.toLowerCase().includes(q) ||
      (r.actorEmail ?? '').toLowerCase().includes(q) ||
      (r.resourceId ?? '').toLowerCase().includes(q)
    );
  });
  const total = data?.meta?.total;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ mb: 0.5 }}>
        <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Activity</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
          Newest first · every store change, invitation, and role edit with who did it.
        </Typography>
      </Box>

      <GuideAccordion title="How the activity feed works">
        <HowRow n={1}>Every mutation in the store appends one row — nothing is ever edited or deleted.</HowRow>
        <HowRow n={2}>Filter by action (e.g. staff.joined) or search by actor email, action, or resource id.</HowRow>
        <HowRow n={3}>Each row carries the request id — paste it to support when reporting a problem.</HowRow>
      </GuideAccordion>

      <TableCard
        title="Audit log"
        subtitle={total != null ? `${total} events total` : `${rows.length} events on this page`}
        toolbar={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <SelectField label="Action" value={action} onChange={(v) => { setAction(v); setPage(1); }} options={KNOWN_ACTIONS} placeholder="All actions" minWidth={200} />
            <SearchField value={query} onChange={setQuery} placeholder="Search actor, action, resource…" aria-label="Search activity" />
          </Box>
        }
        footer={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
            <Typography variant="caption" color="text.secondary">Page {page}</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="small" variant="outlined" disabled={rows.length < 20} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </Box>
        }
        empty={{ when: rows.length === 0, title: 'No events match', description: 'Clear the action filter or search to see the full feed.' }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Store audit log">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Chip size="small" label={r.action} variant="outlined" />
                    {r.requestId ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{r.requestId}</Typography> : null}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem' }}>{r.actorEmail ?? '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.82rem' }}>
                    {r.resourceType ?? '—'}{r.resourceId ? ` · ${r.resourceId.slice(0, 8)}…` : ''}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableCard>
    </Box>
  );
}
