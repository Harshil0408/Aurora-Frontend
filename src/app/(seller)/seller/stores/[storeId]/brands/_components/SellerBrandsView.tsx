'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import { FormField, Modal, SearchField, SelectField } from '@/components/ui/controls';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { DataLoader } from '@/components/ui/DataLoader';
import { AssetUploadField } from '@/components/ui/AssetUploadField';
import { SellerForbidden, useSellerCan } from '@/components/seller/SellerGuards';
import { normaliseApiError } from '@/types/api';
import type { ApprovalState, BrandAccessState } from '@/types/brands';
import {
  useSellerApplyBrandAuthMutation,
  useSellerBrandAuthorisationsQuery,
  useSellerBrandRequestsQuery,
  useSellerBrandsQuery,
  useSellerRequestBrandMutation,
} from '@/services/sellerBrandsApi';
import { useSellerMediaQuery } from '@/services/sellerMediaApi';

function AccessChip({ access, expiresAt }: { access: BrandAccessState; expiresAt: string | null }) {
  if (access === 'open') return null;
  const label =
    access === 'granted'
      ? expiresAt
        ? `Granted · till ${new Date(expiresAt).toLocaleDateString()}`
        : 'Granted'
      : access === 'pending'
        ? 'Pending review'
        : access === 'expired'
          ? 'Expired'
          : 'Restricted';
  return (
    <Chip
      size="small"
      label={label}
      color={access === 'granted' ? 'success' : access === 'pending' ? 'warning' : access === 'expired' ? 'error' : 'default'}
      variant="outlined"
      icon={access === 'restricted' || access === 'expired' ? <LockIcon fontSize="small" /> : undefined}
    />
  );
}

export function SellerBrandsView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  const canView = can('brand:view');
  const canRequest = can('brand:request');

  const [tab, setTab] = useState<'browse' | 'requests' | 'auth'>('browse');
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqWebsite, setReqWebsite] = useState('');
  const [reqLogo, setReqLogo] = useState('');
  const [reqWhy, setReqWhy] = useState('');
  const [reqProofs, setReqProofs] = useState<string[]>([]);
  const [applying, setApplying] = useState<{ id: string; name: string } | null>(null);
  const [docs, setDocs] = useState<string[]>([]);
  const [applyNote, setApplyNote] = useState('');
  const [applyExpiry, setApplyExpiry] = useState('');
  const [queueStatus, setQueueStatus] = useState<ApprovalState>('PENDING');

  const list = useSellerBrandsQuery({ storeId, search, openOnly }, { skip: !storeId || !canView });
  const requests = useSellerBrandRequestsQuery({ storeId, status: queueStatus }, { skip: !storeId || !canView || tab !== 'requests' });
  const authRows = useSellerBrandAuthorisationsQuery({ storeId, status: queueStatus }, { skip: !storeId || !canView || tab !== 'auth' });
  const docsQuery = useSellerMediaQuery(
    { storeId, limit: 50, kind: 'DOCUMENT' },
    { skip: !storeId || (!applying && reqProofs.length === 0 && !reqOpen) },
  );
  const [requestMut, requestState] = useSellerRequestBrandMutation();
  const [applyMut, applyState] = useSellerApplyBrandAuthMutation();

  const rows = list.data?.data ?? [];
  const visible = search.trim()
    ? rows.filter((b) => b.name.toLowerCase().includes(search.trim().toLowerCase()) || b.slug.includes(search.trim().toLowerCase()))
    : rows;

  if (!canView) {
    return (
      <Box sx={{ mt: 0.5 }}>
        <SellerForbidden />
      </Box>
    );
  }
  if (list.isLoading) return <DataLoader label="Loading brands" variant="skeleton" />;
  if (list.isError) {
    return (
      <Alert severity="error" action={<Button size="small" color="inherit" onClick={() => list.refetch()}>Retry</Button>}>
        Couldn&apos;t load brands — {normaliseApiError(list.error as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>Brands</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            The marketplace brand master — your products attach here in Module 6.
          </Typography>
        </Box>
        {canRequest ? (
          <Button size="small" variant="contained" startIcon={<AddIcon fontSize="small" />} onClick={() => { setReqOpen(true); setReqName(''); setReqWebsite(''); setReqLogo(''); setReqWhy(''); setReqProofs([]); }}>
            Request a brand
          </Button>
        ) : null}
      </Box>

      <GuideAccordion title="How brands work for sellers">
        <HowRow n={1}>Pick an existing brand for your products — duplicates get merged by the marketplace admin.</HowRow>
        <HowRow n={2}>Restricted brands need an approved authorisation letter; expiry warns, then auto-unpublish (Module 6).</HowRow>
        <HowRow n={3}>Missing? Request it with a logo and proof of ownership, or ship products as Unbranded / Generic.</HowRow>
      </GuideAccordion>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Brand sections">
        <Tab value="browse" label={`Browse (${rows.length})`} />
        <Tab value="requests" label="My requests" />
        <Tab value="auth" label="Authorisations" />
      </Tabs>

      {tab === 'browse' ? (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchField value={search} onChange={setSearch} placeholder="Search brands…" aria-label="Search brands" />
            <SelectField
              label="Availability"
              value={openOnly ? 'open' : ''}
              onChange={(v) => setOpenOnly(v === 'open')}
              options={[{ value: '', label: 'All brands' }, { value: 'open', label: 'Unrestricted only' }]}
              minWidth={180}
            />
          </Box>
          {visible.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              {rows.length === 0 ? 'No brands match — request one or sell as Unbranded / Generic.' : 'No brands match your search.'}
            </Alert>
          ) : (
            visible.map((b) => (
              <Box key={b.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, mt: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.name}</Typography>
                  <AccessChip access={b.access} expiresAt={b.authorisationExpiresAt} />
                  <Box sx={{ flex: 1 }} />
                  {b.restricted && b.access !== 'granted' && b.access !== 'pending' && canRequest ? (
                    <Button size="small" onClick={() => { setApplying({ id: b.id, name: b.name }); setDocs([]); setApplyNote(''); setApplyExpiry(''); }}>
                      Apply
                    </Button>
                  ) : null}
                  {b.restricted && b.access === 'pending' ? <Typography variant="caption" color="text.secondary">application under review</Typography> : null}
                </Box>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  {b.website ?? 'no website'} · {b.country ?? 'no country'}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      ) : null}

      {tab === 'requests' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalState)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
          </Box>
          {(requests.data?.data ?? []).length === 0 && !requests.isLoading ? (
            <Alert severity="info">No requests with this status — propose a missing brand to get started.</Alert>
          ) : null}
          {(requests.data?.data ?? []).map((r) => (
            <Box key={r.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</Typography>
                <Chip size="small" label={r.status} color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'} variant="outlined" />
                {r.resolvedBrand ? <Chip size="small" label={`linked: ${r.resolvedBrand.name}`} color="info" variant="outlined" /> : null}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">{new Date(r.createdAt).toLocaleDateString()}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.83rem', mt: 0.5 }}>{r.justification}</Typography>
              <Typography variant="caption" color="text.secondary">{r.proofAssetIds.length} proof document(s)</Typography>
              {r.reviewNote ? <Typography variant="caption" color="text.secondary"> · Review: {r.reviewNote}</Typography> : null}
            </Box>
          ))}
        </Box>
      ) : null}

      {tab === 'auth' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SelectField label="Status" value={queueStatus} onChange={(v) => setQueueStatus(v as ApprovalState)} options={['PENDING', 'APPROVED', 'REJECTED']} minWidth={160} />
          </Box>
          {(authRows.data?.data ?? []).length === 0 && !authRows.isLoading ? (
            <Alert severity="info">No applications — apply from the Browse tab on any restricted brand.</Alert>
          ) : null}
          {(authRows.data?.data ?? []).map((g) => (
            <Box key={g.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.brand.name}</Typography>
                <Chip size="small" label={g.status} color={g.status === 'APPROVED' ? 'success' : g.status === 'REJECTED' ? 'error' : 'warning'} variant="outlined" />
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {g.documentAssetIds.length} document(s){g.expiresAt ? ` · expires ${new Date(g.expiresAt).toLocaleDateString()}` : ''}
                </Typography>
              </Box>
              {g.reviewNote ? <Typography variant="caption" color="text.secondary">Review: {g.reviewNote}</Typography> : null}
            </Box>
          ))}
        </Box>
      ) : null}

      <Modal
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        title="Request a brand"
        subtitle="An admin reviews every proposal — approvals link to the real brand."
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setReqOpen(false)}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              disabled={requestState.isLoading || reqName.trim().length < 2 || reqWhy.trim().length < 10}
              onClick={() => {
                void requestMut({
                  storeId,
                  name: reqName.trim(),
                  justification: reqWhy.trim(),
                  proofAssetIds: reqProofs,
                  ...(reqWebsite.trim() ? { website: reqWebsite.trim() } : {}),
                  ...(reqLogo.trim() ? { logoUrl: reqLogo.trim() } : {}),
                })
                  .unwrap().then(() => { setReqOpen(false); setDocs([]); setReqProofs([]); setTab('requests'); });
              }}
            >
              {requestState.isLoading ? 'Sending…' : 'Send request'}
            </Button>
          </>
        }
      >
        <FormField label="Proposed name" value={reqName} onChange={(e) => setReqName(e.target.value)} hint="The exact brand, as printed on your authorisation letter." />
        <FormField label="Website (optional)" value={reqWebsite} onChange={(e) => setReqWebsite(e.target.value)} hint="Official site, if one exists." />
        <AssetUploadField label="Logo (optional)" value={reqLogo} onChange={setReqLogo} uploadUrl={`/seller/catalog/${storeId}/media`} uploadExtra={{ folder: 'brands' }} hint="Square mark for review and future product tiles." />
        <FormField label="Justification" value={reqWhy} onChange={(e) => setReqWhy(e.target.value)} multiline minRows={3} hint="Min 10 chars — what do you sell under this brand, and what proof do you attach?" />
        <Typography sx={{ fontSize: '0.84rem', mt: 1 }}>Proof of ownership / authorisation (PDFs from Media):</Typography>
        {(docsQuery.data?.data ?? []).length === 0 && !docsQuery.isLoading ? (
          <Alert severity="info" sx={{ mt: 0.5 }}>No PDFs in your library yet — upload them under Media first. Proofs are optional but speed up approval.</Alert>
        ) : null}
        {(docsQuery.data?.data ?? []).map((d) => (
          <Box key={d.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 0.5 }}>
            <Checkbox
              size="small"
              checked={reqProofs.includes(d.id)}
              onChange={(e) => setReqProofs((prev) => (e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)))}
            />
            <Typography sx={{ fontSize: '0.84rem' }}>{d.fileName}</Typography>
          </Box>
        ))}
        {requestState.isError ? <Alert severity="error">{normaliseApiError(requestState.error).message}</Alert> : null}
      </Modal>

      <Modal
        open={!!applying}
        onClose={() => { setApplying(null); setDocs([]); }}
        title={`Apply — ${applying?.name}`}
        subtitle="Your authorisation letters go to the marketplace admin; approval unlocks restricted products."
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
                void applyMut({
                  storeId,
                  brandId: applying.id,
                  documentAssetIds: docs,
                  ...(applyNote.trim() ? { note: applyNote.trim() } : {}),
                  ...(applyExpiry ? { expiresAt: new Date(applyExpiry).toISOString() } : {}),
                })
                  .unwrap()
                  .then(() => { setApplying(null); setDocs([]); setTab('auth'); })
                  .catch(() => setApplying(applying));
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
        <FormField label="Note (optional)" value={applyNote} onChange={(e) => setApplyNote(e.target.value)} multiline minRows={2} hint="Anything the reviewer should know." />
        <FormField label="Grant valid until (optional)" type="date" value={applyExpiry} onChange={(e) => setApplyExpiry(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} hint="The admin confirms the final expiry on approval." />
        {applyState.isError ? <Alert severity="error">{normaliseApiError(applyState.error).message}</Alert> : null}
      </Modal>
    </Box>
  );
}
