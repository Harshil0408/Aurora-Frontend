'use client';

import { useDeferredValue, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import UploadIcon from '@mui/icons-material/Upload';
import { AccessDenied, RbacGuard, usePermissions } from '@/components/auth/RbacGuard';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { Modal, FormField, SearchField, SelectField, TableCard } from '@/components/ui/controls';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { normaliseApiError } from '@/types/api';
import type { ApprovalState, Brand, BrandImportRow, BrandStatus } from '@/types/brands';
import {
  useBrandAuthorisationsQuery,
  useBrandRequestsQuery,
  useExportBrandsQuery,
  useImportBrandsMutation,
  useListBrandsQuery,
  useMergeBrandMutation,
  useReviewBrandAuthorisationMutation,
  useReviewBrandRequestMutation,
  useSetBrandStatusMutation,
} from '@/services/brandsApi';
import { BrandFormDialog } from './BrandFormDialog';

function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let quoted = false;
  const push = () => {
    cur.push(field);
    field = '';
  };
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') push();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      push();
      if (cur.some((f) => f.trim() !== '')) rows.push(cur);
      cur = [];
    } else field += c;
  }
  push();
  if (cur.some((f) => f.trim() !== '')) rows.push(cur);
  if (rows.length < 2) return [];
  const header = (rows[0] ?? []).map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, unknown> = {};
    header.forEach((h, i) => {
      if (h) obj[h] = (r[i] ?? '').trim();
    });
    return obj;
  });
}

function toCsv(rows: Record<string, unknown>[]): string {
  const header = ['name', 'slug', 'website', 'country', 'description', 'status', 'restricted', 'featured'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n');
}

export function BrandsView() {
  const { can } = usePermissions();
  const canManage = can('brand.manage');
  const [tab, setTab] = useState<'brands' | 'requests' | 'auth'>('brands');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [merging, setMerging] = useState<Brand | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');
  const [queueStatus, setQueueStatus] = useState<ApprovalState>('PENDING');
  const [requestReviewing, setRequestReviewing] = useState<{ id: string; name: string } | null>(null);
  const [requestDecision, setRequestDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [requestNote, setRequestNote] = useState('');
  const [resolvedBrandId, setResolvedBrandId] = useState('');
  const [authReviewing, setAuthReviewing] = useState<{ id: string; brand: string; store: string } | null>(null);
  const [authDecision, setAuthDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [authNote, setAuthNote] = useState('');
  const [authExpires, setAuthExpires] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<BrandImportRow[] | null>(null);
  const [importName, setImportName] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const brands = useListBrandsQuery({ limit: 100 }, { skip: !canManage });
  const requests = useBrandRequestsQuery({ status: queueStatus }, { skip: !canManage || tab !== 'requests' });
  const auth = useBrandAuthorisationsQuery({ status: queueStatus }, { skip: !canManage || tab !== 'auth' });
  const [setStatusMut, setStatusState] = useSetBrandStatusMutation();
  const [mergeMut, mergeState] = useMergeBrandMutation();
  const [importMut, importState] = useImportBrandsMutation();
  const [reviewReq, reviewReqState] = useReviewBrandRequestMutation();
  const [reviewAuth, reviewAuthState] = useReviewBrandAuthorisationMutation();
  const exportQuery = useExportBrandsQuery(undefined, { skip: true });

  const rows = useMemo(() => brands.data?.data ?? [], [brands.data]);
  const visible = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return rows.filter((b) => {
      if (status && b.status !== status) return false;
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.slug.includes(q);
    });
  }, [rows, deferredSearch, status]);

  if (!canManage) {
    return (
      <RbacGuard perm="brand.manage">
        <AccessDenied title="Brands are restricted" description="You don't hold brand.manage — ask an administrator for catalog access." />
      </RbacGuard>
    );
  }
  if (brands.isLoading) return <DataLoader label="Loading brands" />;
  if (brands.isError) {
    return (
      <FallbackUI tone="error" title="Couldn't load brands" description={normaliseApiError(brands.error).message} actionLabel="Retry" onAction={() => brands.refetch()} />
    );
  }

  const openForm = (brand: Brand | null) => {
    setEditing(brand);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const downloadExport = async () => {
    const res = await exportQuery.refetch();
    const data = (res.data?.data ?? []) as Record<string, unknown>[];
    const blob = new Blob([toCsv(data)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brands.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setImportName(f.name);
    setImportRows(parseCsv(await f.text()) as unknown as BrandImportRow[]);
    setImportOpen(true);
  };

  const preview = (importState.data?.data ?? null) as { brandCount?: number; createdCount?: number; skippedCount?: number; errors?: { row: number; message: string }[] } | null;

  return (
    <RbacGuard perm="brand.manage">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: '1.3rem', letterSpacing: '-0.01em' }}>
              Brands
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem', mt: 0.25 }}>
              The brand master — {rows.length} brand{rows.length === 1 ? '' : 's'} · restricted ones gate publishing.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />} onClick={() => void downloadExport()}>
              Export CSV
            </Button>
            <Button size="small" variant="outlined" startIcon={<UploadIcon fontSize="small" />} onClick={() => fileInput.current?.click()}>
              Import CSV
            </Button>
            <input ref={fileInput} type="file" hidden accept=".csv,text/csv" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
            <Button size="small" variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => openForm(null)}>
              New brand
            </Button>
          </Box>
        </Box>

        <GuideAccordion title="How brands work">
          <HowRow n={1}>Brands are a global master — every store picks from the same list; duplicates should be merged, not recreated.</HowRow>
          <HowRow n={2}>Merging re-points approvals and resolutions to the surviving brand and retires the old slug as a permanent redirect.</HowRow>
          <HowRow n={3}>Restricted brands need an approved authorisation per store — review seller applications under Authorisations.</HowRow>
          <HowRow n={4}>Deactivating hides the brand from sellers and storefront listings without deleting any data.</HowRow>
        </GuideAccordion>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Brand sections">
          <Tab value="brands" label={`Brands (${visible.length})`} />
          <Tab value="requests" label="Seller requests" />
          <Tab value="auth" label="Authorisations" />
        </Tabs>

        {tab === 'brands' ? (
          <TableCard
            title="Brand master"
            subtitle={`${visible.length} shown · search and filter to audit duplicates`}
            toolbar={
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <SearchField value={search} onChange={setSearch} placeholder="Search name, slug…" aria-label="Search brands" />
                <SelectField label="Status" value={status} onChange={setStatus} options={['ACTIVE', 'INACTIVE']} placeholder="All statuses" minWidth={150} />
              </Box>
            }
            empty={{ when: visible.length === 0, title: rows.length === 0 ? 'No brands yet' : 'No matches', description: rows.length === 0 ? 'Create the first brand, or import a CSV.' : 'Clear the search or status filter.' }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Brand master">
                <TableHead>
                  <TableRow>
                    <TableCell>Brand</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Flags</TableCell>
                    <TableCell>Web / country</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell sx={{ fontSize: '0.84rem', maxWidth: 260 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{b.name}</Typography>
                        {b.description ? <Typography variant="caption" color="text.secondary">{b.description.slice(0, 80)}</Typography> : null}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'ui-monospace, monospace' }}>{b.slug}</TableCell>
                      <TableCell>
                        <Chip size="small" label={b.status} color={b.status === 'ACTIVE' ? 'success' : 'default'} variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                        {b.restricted ? <Chip size="small" label="Restricted" color="warning" variant="outlined" /> : null}
                        {b.featured ? <Chip size="small" label="Featured" color="info" variant="outlined" sx={{ ml: 0.5 }} /> : null}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{b.website ?? '—'} · {b.country ?? '—'}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={() => openForm(b)}>Edit</Button>
                        <Button
                          size="small"
                          color={b.status === 'ACTIVE' ? 'warning' : 'success'}
                          disabled={setStatusState.isLoading}
                          onClick={() => { void setStatusMut({ id: b.id, status: (b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as BrandStatus, reason: b.status === 'ACTIVE' ? 'Hidden by admin' : 'Restored by admin' }); }}
                        >
                          {b.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="small" startIcon={<MergeTypeIcon fontSize="small" />} onClick={() => { setMerging(b); setMergeTarget(''); }}>Merge</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCard>
        ) : null}

        {tab === 'requests' ? (
          <QueueTable
            title="Seller brand requests"
            loading={requests.isLoading}
            error={requests.isError ? normaliseApiError(requests.error).message : null}
            onRetry={() => requests.refetch()}
            emptyTitle="No seller requests"
            emptyHint="Sellers propose missing brands from their catalog — they land here."
            head={['Proposed', 'Store', 'Justification', 'Status', '']}
            rows={(requests.data?.data ?? []).map((r) => ({
              key: r.id,
              cells: [
                <Box key="n"><Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{r.name}</Typography><Typography variant="caption" color="text.secondary">{r.website ?? 'no website'}</Typography></Box>,
                <Typography key="s" sx={{ fontSize: '0.82rem' }}>{r.store?.name ?? r.storeId.slice(0, 8)}</Typography>,
                <Typography key="j" sx={{ fontSize: '0.82rem', maxWidth: 280 }}>{r.justification}</Typography>,
                <StatusChip key="st" status={r.status} />,
              ],
              action: r.status === 'PENDING' ? (
                <Button key="a" size="small" onClick={() => { setRequestReviewing({ id: r.id, name: r.name }); setRequestDecision('APPROVED'); setRequestNote(''); setResolvedBrandId(''); }}>
                  Review
                </Button>
              ) : undefined,
            }))}
            queueFilter={
              <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalState)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
            }
          />
        ) : null}

        {tab === 'auth' ? (
          <QueueTable
            title="Restricted-brand applications"
            loading={auth.isLoading}
            error={auth.isError ? normaliseApiError(auth.error).message : null}
            onRetry={() => auth.refetch()}
            emptyTitle="No applications"
            emptyHint="Sellers file authorisation letters for restricted brands — they land here."
            head={['Brand', 'Store', 'Documents', 'Expiry', 'Status', '']}
            rows={(auth.data?.data ?? []).map((g) => ({
              key: g.id,
              cells: [
                <Typography key="c" sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{g.brand?.name ?? g.brandId.slice(0, 8)}</Typography>,
                <Typography key="s" sx={{ fontSize: '0.82rem' }}>{g.store?.name ?? g.storeId.slice(0, 8)}</Typography>,
                <Typography key="d" sx={{ fontSize: '0.82rem' }}>{g.documentAssetIds.length} document(s)</Typography>,
                <Typography key="e" sx={{ fontSize: '0.82rem' }}>{g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : 'no expiry'}</Typography>,
                <StatusChip key="st" status={g.status} />,
              ],
              action: g.status === 'PENDING' ? (
                <Button key="a" size="small" onClick={() => { setAuthReviewing({ id: g.id, brand: g.brand?.name ?? g.brandId, store: g.store?.name ?? '' }); setAuthDecision('APPROVED'); setAuthNote(''); setAuthExpires(''); }}>
                  Review
                </Button>
              ) : undefined,
            }))}
            queueFilter={
              <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalState)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
            }
          />
        ) : null}
      </Box>

      {formOpen ? (
        <BrandFormDialog key={formKey} open onClose={() => setFormOpen(false)} editing={editing} />
      ) : null}

      <Modal
        open={!!merging}
        onClose={() => setMerging(null)}
        title={`Merge “${merging?.name}” into…`}
        subtitle="Products stay on their rows — approvals and history re-point to the survivor."
        icon={<MergeTypeIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setMerging(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="error"
              disabled={!mergeTarget || mergeState.isLoading}
              onClick={() => {
                if (!merging) return;
                void mergeMut({ id: merging.id, targetId: mergeTarget, reason: 'Duplicate merged by admin' })
                  .unwrap()
                  .then(() => setMerging(null));
              }}
            >
              {mergeState.isLoading ? 'Merging…' : 'Merge duplicate'}
            </Button>
          </>
        }
      >
        <Alert severity="warning">
          “{merging?.name}” ({merging?.slug}) will be soft-deleted and its slug retired as a redirect. This cannot be undone.
        </Alert>
        <SelectField
          label="Surviving brand"
          value={mergeTarget}
          onChange={setMergeTarget}
          options={rows.filter((b) => b.id !== merging?.id && b.status === 'ACTIVE').map((b) => ({ value: b.id, label: `${b.name} (${b.slug})` }))}
          placeholder="Choose — required"
          hint="Merged brand's authorisations move here with their renewal dates kept."
        />
        {mergeState.isError ? <Alert severity="error">{normaliseApiError(mergeState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportRows(null); }}
        title="Import brands"
        subtitle={importName || 'CSV preview'}
        maxWidth="md"
        icon={<UploadIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => { setImportOpen(false); setImportRows(null); }}>Close</Button>
            <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={!importRows?.length || importState.isLoading || (preview?.createdCount ?? 0) > 0}
            onClick={() => { void importMut({ mode: 'commit', rows: importRows ?? [] }); }}
          >
              {importState.isLoading ? 'Importing…' : 'Commit import'}
            </Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '0.84rem' }}>
          Columns: <Typography component="span" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>name, slug, website, country, description, status, restricted, featured</Typography>.
          Downloads via Export CSV make a perfect starting template.
        </Typography>
        {!importRows?.length ? <Alert severity="warning">No data rows found in {importName || 'the file'}.</Alert> : null}
        {preview ? (
          <Alert severity={preview.errors?.length ? 'warning' : 'success'}>
            {preview.createdCount !== undefined
              ? `Committed — ${preview.createdCount} created, ${preview.skippedCount ?? 0} skipped.`
              : `Preview — ${preview.brandCount} brands to create, ${preview.skippedCount ?? 0} duplicates skipped`}
            {preview.errors?.length ? `, ${preview.errors.length} row(s) with errors (listed below, skipped on commit).` : '.'}
          </Alert>
        ) : null}
        {preview?.errors?.map((e) => (
          <Alert key={e.row} severity="error">Row {e.row}: {e.message}</Alert>
        ))}
        {!preview && importRows?.length ? (
          <Button
            variant="outlined"
            disabled={importState.isLoading}
            onClick={() => { void importMut({ mode: 'validate', rows: importRows ?? [] }); }}
          >
            {importState.isLoading ? 'Validating…' : `Validate ${importRows.length} rows`}
          </Button>
        ) : null}
        {importState.isError ? <Alert severity="error">{normaliseApiError(importState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={!!requestReviewing}
        onClose={() => setRequestReviewing(null)}
        title={`Review — ${requestReviewing?.name}`}
        subtitle="Approving files the request; create the real brand first, then link it below."
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setRequestReviewing(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color={requestDecision === 'APPROVED' ? 'primary' : 'error'}
              disabled={reviewReqState.isLoading}
              onClick={() => {
                if (!requestReviewing) return;
                void reviewReq({ id: requestReviewing.id, decision: requestDecision, reviewNote: requestNote || undefined, resolvedBrandId: resolvedBrandId || null })
                  .unwrap().then(() => setRequestReviewing(null));
              }}
            >
              {requestDecision === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <SelectField label="Decision" value={requestDecision} onChange={(v) => setRequestDecision(v as 'APPROVED' | 'REJECTED')} options={['APPROVED', 'REJECTED']} />
        {requestDecision === 'APPROVED' ? (
          <SelectField label="Link to real brand (optional)" value={resolvedBrandId} onChange={setResolvedBrandId} options={rows.map((b) => ({ value: b.id, label: `${b.name} (${b.slug})` }))} placeholder="No link — request only" hint="Create the brand via New brand first if it doesn't exist yet." />
        ) : null}
        <FormField label="Review note" value={requestNote} onChange={(e) => setRequestNote(e.target.value)} multiline minRows={2} hint="Shown to the seller with the decision." />
        {reviewReqState.isError ? <Alert severity="error">{normaliseApiError(reviewReqState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={!!authReviewing}
        onClose={() => setAuthReviewing(null)}
        title={`Review authorisation — ${authReviewing?.brand}`}
        subtitle={authReviewing?.store}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setAuthReviewing(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color={authDecision === 'APPROVED' ? 'primary' : 'error'}
              disabled={reviewAuthState.isLoading}
              onClick={() => {
                if (!authReviewing) return;
                void reviewAuth({
                  id: authReviewing.id,
                  decision: authDecision,
                  reviewNote: authNote || undefined,
                  expiresAt: authExpires ? new Date(authExpires).toISOString() : authDecision === 'APPROVED' ? null : undefined,
                })
                  .unwrap().then(() => setAuthReviewing(null));
              }}
            >
              {authDecision === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <SelectField label="Decision" value={authDecision} onChange={(v) => setAuthDecision(v as 'APPROVED' | 'REJECTED')} options={['APPROVED', 'REJECTED']} />
        {authDecision === 'APPROVED' ? (
          <FormField label="Authorisation expires on (optional)" type="date" value={authExpires} onChange={(e) => setAuthExpires(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} hint="Expiring grants warn, then auto-unpublish gated products (Module 6 scheduler)." />
        ) : null}
        <FormField label="Review note" value={authNote} onChange={(e) => setAuthNote(e.target.value)} multiline minRows={2} hint="Shown to the seller with the decision." />
        <Alert severity="info">Check that the uploaded letters name this store and cover this brand before approving.</Alert>
        {reviewAuthState.isError ? <Alert severity="error">{normaliseApiError(reviewAuthState.error).message}</Alert> : null}
      </Modal>
    </RbacGuard>
  );
}

function StatusChip({ status }: { status: ApprovalState }) {
  return (
    <Chip size="small" label={status} color={status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'warning'} variant="outlined" />
  );
}

function QueueTable({ title, loading, error, onRetry, emptyTitle, emptyHint, head, rows, queueFilter }: {
  title: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyHint: string;
  head: string[];
  rows: Array<{ key: string; cells: React.ReactNode[]; action?: React.ReactNode }>;
  queueFilter: React.ReactNode;
}) {
  if (loading) return <DataLoader label={`Loading ${title.toLowerCase()}`} />;
  if (error) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={onRetry}>Retry</Button>}>
        Couldn&apos;t load {title.toLowerCase()} — {error}
      </Alert>
    );
  }
  return (
    <TableCard
      title={title}
      subtitle={`${rows.length} shown · oldest first`}
      toolbar={<Box sx={{ display: 'flex', gap: 1 }}>{queueFilter}</Box>}
      empty={{ when: rows.length === 0, title: emptyTitle, description: emptyHint }}
    >
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" aria-label={title}>
          <TableHead>
            <TableRow>{head.map((h) => <TableCell key={h}>{h}</TableCell>)}</TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.key}>
                {r.cells.map((c, i) => <TableCell key={i}>{c}</TableCell>)}
                <TableCell align="right">{r.action}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </TableCard>
  );
}
