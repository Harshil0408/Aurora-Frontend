'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import { FormField, Modal, SearchField, SelectField } from '@/components/ui/controls';
import { DataLoader } from '@/components/ui/DataLoader';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { SellerForbidden, useSellerCan } from '@/components/seller/SellerGuards';
import { normaliseApiError } from '@/types/api';
import type { ApprovalStatus, SellerCategoryNode } from '@/types/categories';
import {
  useSellerApplyCategoryAccessMutation,
  useSellerCategoryAccessQuery,
  useSellerCategoryTreeQuery,
  useSellerCategoryRequestsQuery,
  useSellerRequestCategoryMutation,
} from '@/services/sellerCategoriesApi';
import { useSellerMediaQuery } from '@/services/sellerMediaApi';

function AccessChip({ access }: { access: SellerCategoryNode['access'] }) {
  if (access === 'open') return null;
  return (
    <Chip
      size="small"
      label={access === 'granted' ? 'Granted' : access === 'pending' ? 'Pending review' : 'Restricted'}
      color={access === 'granted' ? 'success' : access === 'pending' ? 'warning' : 'default'}
      variant="outlined"
      icon={access === 'restricted' ? <LockIcon fontSize="small" /> : undefined}
    />
  );
}

function TreeRows({ nodes, depth, expanded, onToggle, onApply, canRequest }: {
  nodes: SellerCategoryNode[];
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onApply: (node: SellerCategoryNode) => void;
  canRequest: boolean;
}) {
  return (
    <>
      {nodes.map((n) => (
        <Box key={n.id}>
          <ListItemButton sx={{ pl: 1 + depth * 2.5 }} onClick={() => (n.children?.length ? onToggle(n.id) : undefined)}>
            {n.children?.length ? (
              expanded.has(n.id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />
            ) : (
              <Box sx={{ width: 20 }} />
            )}
            <ListItemText
              primary={n.name}
              secondary={depth > 0 ? n.breadcrumb : n.slug}
              slotProps={{ primary: { fontSize: '0.87rem', fontWeight: depth === 0 ? 600 : 400 } as object, secondary: { fontSize: '0.75rem' } as object }}
            />
            {n.leaf ? <Chip size="small" label="Leaf" color="info" variant="outlined" sx={{ mr: 0.5 }} /> : null}
            <AccessChip access={n.access} />
            {n.restricted && n.access !== 'granted' && canRequest ? (
              <Button
                size="small"
                sx={{ ml: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(n);
                }}
              >
                {n.access === 'pending' ? 'Pending…' : 'Apply'}
              </Button>
            ) : null}
          </ListItemButton>
          {n.children?.length ? (
            <Collapse in={expanded.has(n.id)}>
              <TreeRows nodes={n.children} depth={depth + 1} expanded={expanded} onToggle={onToggle} onApply={onApply} canRequest={canRequest} />
            </Collapse>
          ) : null}
        </Box>
      ))}
    </>
  );
}

export function SellerCategoriesView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  const canView = can('category:view');
  const canRequest = can('category:request');

  const [tab, setTab] = useState<'browse' | 'requests' | 'access'>('browse');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reqOpen, setReqOpen] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqWhy, setReqWhy] = useState('');
  const [reqParent, setReqParent] = useState('');
  const [applying, setApplying] = useState<SellerCategoryNode | null>(null);
  const [docs, setDocs] = useState<string[]>([]);
  const [queueStatus, setQueueStatus] = useState<ApprovalStatus>('PENDING');

  const tree = useSellerCategoryTreeQuery(storeId, { skip: !storeId || !canView });
  const requests = useSellerCategoryRequestsQuery({ storeId, status: queueStatus }, { skip: !storeId || !canView || tab !== 'requests' });
  const accessRows = useSellerCategoryAccessQuery({ storeId, status: queueStatus }, { skip: !storeId || !canView || tab !== 'access' });
  const docsQuery = useSellerMediaQuery(
    { storeId, limit: 50, kind: 'DOCUMENT' },
    { skip: !storeId || !applying },
  );
  const [requestMut, requestState] = useSellerRequestCategoryMutation();
  const [applyMut, applyState] = useSellerApplyCategoryAccessMutation();

  const nodes = useMemo(() => tree.data?.data ?? [], [tree.data]);
  const flat = useMemo(() => {
    const out: SellerCategoryNode[] = [];
    const walk = (list: SellerCategoryNode[]) => {
      for (const n of list) {
        out.push(n);
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    return out;
  }, [nodes]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return nodes;
    // Search flattens matches (ancestors implied by breadcrumb).
    const hits = flat.filter((n) => n.name.toLowerCase().includes(q) || n.breadcrumb.toLowerCase().includes(q));
    return hits as SellerCategoryNode[];
  }, [nodes, flat, search]);

  if (!canView) {
    return (
      <Box sx={{ mt: 0.5 }}>
        <SellerForbidden />
      </Box>
    );
  }
  if (tree.isLoading) return <DataLoader label="Loading categories" variant="skeleton" />;
  if (tree.isError) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => tree.refetch()}>Retry</Button>}>
        Couldn&apos;t load categories — {normaliseApiError(tree.error as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Categories</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            The marketplace taxonomy — your products attach to leaf categories only.
          </Typography>
        </Box>
        {canRequest ? (
          <Button size="small" variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => { setReqOpen(true); setReqName(''); setReqWhy(''); setReqParent(''); }}>
            Request a category
          </Button>
        ) : null}
      </Box>

      <GuideAccordion title="How categories work for sellers">
        <HowRow n={1}>Browse the tree — only leaves (badged) can hold products; parents are navigation.</HowRow>
        <HowRow n={2}>Restricted branches need an approved application with PDF proofs before your products can use them.</HowRow>
        <HowRow n={3}>Missing something? Request it — track Pending → Approved/Rejected under My requests.</HowRow>
      </GuideAccordion>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Category sections">
        <Tab value="browse" label="Browse" />
        <Tab value="requests" label="My requests" />
        <Tab value="access" label="Restricted access" />
      </Tabs>

      {tab === 'browse' ? (
        <Box>
          <SearchField value={search} onChange={setSearch} placeholder="Search the tree…" aria-label="Search categories" />
          {filtered.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>No categories match — the marketplace admin publishes the taxonomy.</Alert>
          ) : (
            <List dense sx={{ mt: 0.5, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              {search.trim() ? (
                filtered.map((n) => (
                  <ListItemButton key={n.id}>
                    <ListItemText primary={n.name} secondary={n.breadcrumb} slotProps={{ primary: { fontSize: '0.87rem' } as object, secondary: { fontSize: '0.75rem' } as object }} />
                    {n.leaf ? <Chip size="small" label="Leaf" color="info" variant="outlined" sx={{ mr: 0.5 }} /> : null}
                    <AccessChip access={n.access} />
                  </ListItemButton>
                ))
              ) : (
                <TreeRows nodes={filtered} depth={0} expanded={expanded} onToggle={toggle} onApply={setApplying} canRequest={canRequest} />
              )}
            </List>
          )}
        </Box>
      ) : null}

      {tab === 'requests' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalStatus)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
          </Box>
          {(requests.data?.data ?? []).length === 0 && !requests.isLoading ? (
            <Alert severity="info">No requests with this status — propose a missing category to get started.</Alert>
          ) : null}
          {(requests.data?.data ?? []).map((r) => (
            <Box key={r.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</Typography>
                <Chip size="small" label={r.status} color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'} variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleDateString()}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.83rem', mt: 0.5 }}>{r.justification}</Typography>
              {r.reviewNote ? <Typography variant="caption" color="text.secondary">Review: {r.reviewNote}</Typography> : null}
            </Box>
          ))}
        </Box>
      ) : null}

      {tab === 'access' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalStatus)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
          </Box>
          {(accessRows.data?.data ?? []).length === 0 && !accessRows.isLoading ? (
            <Alert severity="info">No applications — apply from the Browse tab on any restricted branch.</Alert>
          ) : null}
          {(accessRows.data?.data ?? []).map((g) => (
            <Box key={g.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.category.name}</Typography>
                <Chip size="small" label={g.status} color={g.status === 'APPROVED' ? 'success' : g.status === 'REJECTED' ? 'error' : 'warning'} variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">{g.documentAssetIds.length} document(s)</Typography>
              </Box>
              {g.reviewNote ? <Typography variant="caption" color="text.secondary">Review: {g.reviewNote}</Typography> : null}
            </Box>
          ))}
        </Box>
      ) : null}

      <Modal
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        title="Request a category"
        subtitle="An admin reviews every proposal — approvals link to the real category."
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setReqOpen(false)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={requestState.isLoading || reqName.trim().length < 2 || reqWhy.trim().length < 10}
              onClick={() => {
                void requestMut({ storeId, name: reqName.trim(), justification: reqWhy.trim(), proposedParentId: reqParent || null })
                  .unwrap().then(() => { setReqOpen(false); setTab('requests'); });
              }}
            >
              {requestState.isLoading ? 'Sending…' : 'Send request'}
            </Button>
          </>
        }
      >
        <FormField label="Proposed name" value={reqName} onChange={(e) => setReqName(e.target.value)} hint="e.g. Handloom Sarees." />
        <SelectField label="Suggested parent (optional)" value={reqParent} onChange={setReqParent} options={flat.map((n) => ({ value: n.id, label: n.breadcrumb }))} placeholder="Top level" hint="Where you think it belongs — the admin decides finally." />
        <FormField label="Justification" value={reqWhy} onChange={(e) => setReqWhy(e.target.value)} multiline minRows={3} hint="Min 10 chars — what will you sell here, and why existing branches don't fit?" />
        {requestState.isError ? <Alert severity="error">{normaliseApiError(requestState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={!!applying}
        onClose={() => { setApplying(null); setDocs([]); }}
        title={`Apply — ${applying?.name}`}
        subtitle="Your PDF proofs go to the marketplace admin; approval unlocks the branch for your products."
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => { setApplying(null); setDocs([]); }}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={applyState.isLoading || docs.length === 0}
              onClick={() => {
                if (!applying) return;
                void applyMut({ storeId, categoryId: applying.id, documentAssetIds: docs })
                  .unwrap().then(() => { setApplying(null); setDocs([]); setTab('access'); });
              }}
            >
              {applyState.isLoading ? 'Sending…' : 'Send application'}
            </Button>
          </>
        }
      >
        {(docsQuery.data?.data ?? []).length === 0 && !docsQuery.isLoading ? (
          <Alert severity="info">No PDFs in your library yet — upload authorisation letters under Media first.</Alert>
        ) : null}
        {(docsQuery.data?.data ?? []).map((d) => (
          <Box key={d.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 0.5 }}>
            <Checkbox
              size="small"
              checked={docs.includes(d.id)}
              onChange={(e) => setDocs((prev) => (e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)))}
            />
            <Typography sx={{ fontSize: '0.84rem' }}>{d.fileName}</Typography>
          </Box>
        ))}
        {applyState.isError ? <Alert severity="error">{normaliseApiError(applyState.error).message}</Alert> : null}
      </Modal>
    </Box>
  );
}
