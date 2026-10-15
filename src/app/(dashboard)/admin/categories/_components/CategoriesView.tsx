'use client';

import { useMemo, useRef, useState } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import { AccessDenied, RbacGuard, usePermissions } from '@/components/auth/RbacGuard';
import { DataLoader } from '@/components/ui/DataLoader';
import { FallbackUI } from '@/components/ui/FallbackUI';
import { Modal, FormField, SearchField, SelectField, TableCard } from '@/components/ui/controls';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { normaliseApiError } from '@/types/api';
import type { ApprovalStatus, CategoryNode } from '@/types/categories';
import {
  useCategoryAccessQueueQuery,
  useCategoryRequestsQuery,
  useCategoryTreeQuery,
  useDeleteCategoryMutation,
  useExportCategoriesQuery,
  useImportCategoriesMutation,
  useReviewCategoryAccessMutation,
  useReviewCategoryRequestMutation,
  useSetCategoryStatusMutation,
} from '@/services/categoriesApi';
import { CategoryFormDialog } from './CategoryFormDialog';

function flatten(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function parseCsv(text: string): Record<string, unknown>[] {
  // Minimal CSV reader (quoted commas + escaped quotes). The backend
  // re-validates every row, so this only needs to be good, not perfect.
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
    if (obj.displayOrder !== undefined && obj.displayOrder !== '') obj.displayOrder = Number(obj.displayOrder);
    if (obj.showInNav !== undefined && obj.showInNav !== '') obj.showInNav = /^(true|1|yes)$/i.test(String(obj.showInNav));
    return obj;
  });
}

function toCsv(rows: Record<string, unknown>[]): string {
  const header = ['name', 'slug', 'parentPath', 'description', 'displayOrder', 'status', 'showInNav', 'showOnHomepage', 'restricted', 'metaTitle', 'metaDescription'];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n');
}

export function CategoriesView() {
  const { can } = usePermissions();
  const canManage = can('category.manage');
  const [tab, setTab] = useState<'tree' | 'requests' | 'access'>('tree');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formKey, setFormKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState<CategoryNode | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [queueStatus, setQueueStatus] = useState<ApprovalStatus>('PENDING');
  const [reviewing, setReviewing] = useState<{ kind: 'request' | 'access'; id: string; title: string } | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNote, setReviewNote] = useState('');
  const [resolvedCategoryId, setResolvedCategoryId] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, unknown>[] | null>(null);
  const [importName, setImportName] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const tree = useCategoryTreeQuery(undefined, { skip: !canManage });
  const requests = useCategoryRequestsQuery({ status: queueStatus }, { skip: !canManage || tab !== 'requests' });
  const access = useCategoryAccessQueueQuery({ status: queueStatus }, { skip: !canManage || tab !== 'access' });
  const [setStatusMut, setStatusState] = useSetCategoryStatusMutation();
  const [deleteMut, deleteState] = useDeleteCategoryMutation();
  const [importMut, importState] = useImportCategoriesMutation();
  const [reviewReq, reviewReqState] = useReviewCategoryRequestMutation();
  const [reviewAcc, reviewAccState] = useReviewCategoryAccessMutation();
  const exportQuery = useExportCategoriesQuery(undefined, { skip: true });

  const nodes = useMemo(() => tree.data?.data ?? [], [tree.data]);
  const flat = useMemo(() => flatten(nodes), [nodes]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flat.filter((n) => {
      if (status && n.status !== status) return false;
      if (!q) return true;
      return n.name.toLowerCase().includes(q) || n.slug.includes(q) || n.breadcrumb.toLowerCase().includes(q);
    });
  }, [flat, search, status]);

  if (!canManage) {
    return (
      <RbacGuard perm="category.manage">
        <AccessDenied title="Categories are restricted" description="You don't hold category.manage — ask an administrator for catalog access." />
      </RbacGuard>
    );
  }
  if (tree.isLoading) return <DataLoader label="Loading category tree" />;
  if (tree.isError) {
    return (
      <FallbackUI tone="error" title="Couldn't load categories" description={normaliseApiError(tree.error).message} actionLabel="Retry" onAction={() => tree.refetch()} />
    );
  }

  const openForm = (node: CategoryNode | null) => {
    setEditing(node);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const downloadExport = async () => {
    const res = await exportQuery.refetch();
    const rows = (res.data?.data ?? []) as Record<string, unknown>[];
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setImportName(f.name);
    setImportRows(parseCsv(await f.text()));
    setImportOpen(true);
  };

  const preview = importState.data?.data ?? null;

  return (
    <RbacGuard perm="category.manage">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography variant="h1" sx={{ fontSize: '1.3rem', letterSpacing: '-0.01em' }}>
              Categories
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.84rem', mt: 0.25 }}>
              The product taxonomy — {flat.length} categor{flat.length === 1 ? 'y' : 'ies'} · sellers pick leaves only.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />} onClick={downloadExport}>
              Export CSV
            </Button>
            <Button size="small" variant="outlined" startIcon={<UploadIcon fontSize="small" />} onClick={() => fileInput.current?.click()}>
              Import CSV
            </Button>
            <input ref={fileInput} type="file" hidden accept=".csv,text/csv" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
            <Button size="small" variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => openForm(null)}>
              New category
            </Button>
          </Box>
        </Box>

        <GuideAccordion title="How product categories work">
          <HowRow n={1}>Unlimited-depth tree — products attach to leaf nodes only (parents are navigation, not listings).</HowRow>
          <HowRow n={2}>Slugs auto-generate; renaming retires the old slug as a permanent redirect that stays reserved.</HowRow>
          <HowRow n={3}>Deactivating hides the branch (and later its products) from the storefront without deleting seller data.</HowRow>
          <HowRow n={4}>Restricted branches need per-store approval with documents — review those under the Access tab.</HowRow>
        </GuideAccordion>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Category sections">
          <Tab value="tree" label={`Tree (${flat.length})`} />
          <Tab value="requests" label="Seller requests" />
          <Tab value="access" label="Restricted access" />
        </Tabs>

        {tab === 'tree' ? (
          <TableCard
            title="Category tree"
            subtitle={`${visible.length} shown · ordered by display order among siblings`}
            toolbar={
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <SearchField value={search} onChange={setSearch} placeholder="Search name, slug…" aria-label="Search categories" />
                <SelectField label="Status" value={status} onChange={setStatus} options={['ACTIVE', 'INACTIVE']} placeholder="All statuses" minWidth={150} />
              </Box>
            }
            empty={{ when: visible.length === 0, title: flat.length === 0 ? 'No categories yet' : 'No matches', description: flat.length === 0 ? 'Create the first root category, or import a CSV.' : 'Clear the search or status filter.' }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Category tree">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Flags</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell sx={{ fontSize: '0.84rem', maxWidth: 320 }}>
                        <Typography sx={{ fontWeight: n.parentId ? 400 : 600, fontSize: '0.84rem' }}>{n.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{n.breadcrumb}</Typography>
                        {n.leaf ? null : <Chip size="small" label={`${n.childCount} sub`} variant="outlined" sx={{ ml: 0.5 }} />}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'ui-monospace, monospace' }}>{n.slug}</TableCell>
                      <TableCell>
                        <Chip size="small" label={n.status} color={n.status === 'ACTIVE' ? 'success' : 'default'} variant="outlined" />
                        {n.restricted ? <Chip size="small" label="Restricted" color="warning" variant="outlined" sx={{ ml: 0.5 }} /> : null}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                        {n.showInNav ? 'nav' : '—nav'} · {n.showOnHomepage ? 'home' : '—home'} · #{n.displayOrder}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={() => openForm(n)}>Edit</Button>
                        <Button
                          size="small"
                          color={n.status === 'ACTIVE' ? 'warning' : 'success'}
                          disabled={setStatusState.isLoading}
                          onClick={() => { void setStatusMut({ id: n.id, status: n.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', reason: n.status === 'ACTIVE' ? 'Hidden by admin' : 'Restored by admin' }); }}
                        >
                          {n.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => { setDeleting(n); setReassignTo(''); }}>Delete</Button>
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
            title="Seller category requests"
            loading={requests.isLoading}
            error={requests.isError ? normaliseApiError(requests.error).message : null}
            onRetry={() => requests.refetch()}
            emptyTitle="No seller requests"
            emptyHint="Sellers propose missing categories from their catalog — they land here."
            head={['Proposed', 'Store', 'Justification', 'Status', '']}
            rows={(requests.data?.data ?? []).map((r) => ({
              key: r.id,
              cells: [
                <Box key="n"><Typography sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{r.name}</Typography><Typography variant="caption" color="text.secondary">under {r.proposedParent?.name ?? 'top level'}</Typography></Box>,
                <Typography key="s" sx={{ fontSize: '0.82rem' }}>{r.store?.name ?? r.storeId.slice(0, 8)}</Typography>,
                <Typography key="j" sx={{ fontSize: '0.82rem', maxWidth: 280 }}>{r.justification}</Typography>,
                <StatusChip key="st" status={r.status} />,
              ],
              action: r.status === 'PENDING' ? (
                <Button key="a" size="small" onClick={() => { setReviewing({ kind: 'request', id: r.id, title: r.name }); setDecision('APPROVED'); setReviewNote(''); setResolvedCategoryId(''); }}>
                  Review
                </Button>
              ) : undefined,
            }))}
            queueFilter={
              <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalStatus)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
            }
          />
        ) : null}

        {tab === 'access' ? (
          <QueueTable
            title="Restricted-category applications"
            loading={access.isLoading}
            error={access.isError ? normaliseApiError(access.error).message : null}
            onRetry={() => access.refetch()}
            emptyTitle="No applications"
            emptyHint="Sellers file PDF authorisation proofs for restricted branches — they land here."
            head={['Category', 'Store', 'Documents', 'Status', '']}
            rows={(access.data?.data ?? []).map((g) => ({
              key: g.id,
              cells: [
                <Typography key="c" sx={{ fontSize: '0.84rem', fontWeight: 600 }}>{g.category.name}</Typography>,
                <Typography key="s" sx={{ fontSize: '0.82rem' }}>{g.store?.name ?? g.storeId.slice(0, 8)}</Typography>,
                <Typography key="d" sx={{ fontSize: '0.82rem' }}>{g.documentAssetIds.length} PDF(s)</Typography>,
                <StatusChip key="st" status={g.status} />,
              ],
              action: g.status === 'PENDING' ? (
                <Button key="a" size="small" onClick={() => { setReviewing({ kind: 'access', id: g.id, title: g.category.name }); setDecision('APPROVED'); setReviewNote(''); }}>
                  Review
                </Button>
              ) : undefined,
            }))}
            queueFilter={
              <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalStatus)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
            }
          />
        ) : null}
      </Box>

      {formOpen ? (
        <CategoryFormDialog key={formKey} open onClose={() => setFormOpen(false)} tree={nodes} editing={editing} />
      ) : null}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this category?"
        subtitle={deleting?.breadcrumb}
        icon={<DeleteIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => setDeleting(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color="error"
              disabled={deleteState.isLoading || (!!deleting && !deleting.leaf && !reassignTo)}
              onClick={() => {
                if (!deleting) return;
                void deleteMut({ id: deleting.id, reason: 'Removed by admin', reassignTo: reassignTo || null })
                  .unwrap()
                  .then(() => setDeleting(null));
              }}
            >
              {deleteState.isLoading ? 'Deleting…' : 'Delete category'}
            </Button>
          </>
        }
      >
        <Alert severity="error">
          {deleting && !deleting.leaf
            ? `“${deleting.name}” has ${deleting.childCount} sub-categor${deleting.childCount === 1 ? 'y' : 'ies'} — pick a new home below or the delete is blocked.`
            : `“${deleting?.name}” will be soft-deleted (hidden everywhere, kept in history).`}
        </Alert>
        {deleting && !deleting.leaf ? (
          <SelectField label="Move sub-categories to" value={reassignTo} onChange={setReassignTo} options={flat.filter((n) => n.id !== deleting.id).map((n) => ({ value: n.id, label: n.breadcrumb }))} placeholder="Choose — required" hint="Children move here with their order kept." />
        ) : null}
        <Typography color="text.secondary" sx={{ fontSize: '0.84rem' }}>
          Slugs stay reserved as redirects. This is logged in the activity feed.
        </Typography>
        {deleteState.isError ? <Alert severity="error">{normaliseApiError(deleteState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportRows(null); }}
        title="Import categories"
        subtitle={importName || 'CSV preview'}
        maxWidth="md"
        icon={<UploadIcon fontSize="small" />}
        actions={
          <>
            <Button onClick={() => { setImportOpen(false); setImportRows(null); }}>Close</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={!importRows?.length || importState.isLoading || (preview?.committed ?? false)}
              onClick={() => { void importMut({ mode: 'commit', rows: importRows ?? [] }); }}
            >
              {importState.isLoading ? 'Importing…' : 'Commit import'}
            </Button>
          </>
        }
      >
        <Typography sx={{ fontSize: '0.84rem' }}>
          Columns: <Typography component="span" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>name, slug, parentPath, description, displayOrder, status, showInNav</Typography>.
          Parents resolve by slug path (<Typography component="span" sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>fashion/men</Typography>) and must appear earlier in the file. Download the template via Export CSV.
        </Typography>
        {!importRows?.length ? <Alert severity="warning">No data rows found in {importName || 'the file'}.</Alert> : null}
        {preview ? (
          <Alert severity={preview.errors.length ? 'warning' : 'success'}>
            {preview.committed ? `Committed — ${preview.creates} created, ${preview.updates} updated` : `Preview — ${preview.creates} to create, ${preview.updates} to update`}
            {preview.errors.length ? `, ${preview.errors.length} row(s) with errors (listed below, skipped on commit).` : '.'}
          </Alert>
        ) : null}
        {preview?.errors.map((e) => (
          <Alert key={e.row} severity="error">Row {e.row}: {e.message}</Alert>
        ))}
        {!preview && importRows?.length ? (
          <Button
            variant="outlined"
            disabled={importState.isLoading}
            onClick={() => { void importMut({ mode: 'validate', rows: importRows }); }}
          >
            {importState.isLoading ? 'Validating…' : `Validate ${importRows.length} rows`}
          </Button>
        ) : null}
        {importState.isError ? <Alert severity="error">{normaliseApiError(importState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        title={`Review — ${reviewing?.title}`}
        subtitle={reviewing?.kind === 'request' ? 'Approving files the request; create the real category first, then link it below.' : 'Check the filed PDF proofs before approving restricted access.'}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setReviewing(null)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              color={decision === 'APPROVED' ? 'primary' : 'error'}
              disabled={reviewReqState.isLoading || reviewAccState.isLoading}
              onClick={() => {
                if (!reviewing) return;
                if (reviewing.kind === 'request') {
                  void reviewReq({ id: reviewing.id, decision, reviewNote: reviewNote || undefined, resolvedCategoryId: resolvedCategoryId || null })
                    .unwrap().then(() => setReviewing(null));
                } else {
                  void reviewAcc({ id: reviewing.id, decision, reviewNote: reviewNote || undefined })
                    .unwrap().then(() => setReviewing(null));
                }
              }}
            >
              {decision === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        <SelectField label="Decision" value={decision} onChange={(v) => setDecision(v as 'APPROVED' | 'REJECTED')} options={['APPROVED', 'REJECTED']} />
        {reviewing?.kind === 'request' && decision === 'APPROVED' ? (
          <SelectField label="Link to real category (optional)" value={resolvedCategoryId} onChange={setResolvedCategoryId} options={flat.map((n) => ({ value: n.id, label: `${n.breadcrumb} (${n.slug})` }))} placeholder="No link — request only" hint="Create the category via New category first if it doesn't exist yet." />
        ) : null}
        <FormField label="Review note" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} multiline minRows={2} hint="Shown to the seller with the decision." />
        {(reviewReqState.isError || reviewAccState.isError) ? (
          <Alert severity="error">{normaliseApiError(reviewReqState.error ?? reviewAccState.error).message}</Alert>
        ) : null}
      </Modal>
    </RbacGuard>
  );
}

function StatusChip({ status }: { status: ApprovalStatus }) {
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
