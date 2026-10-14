'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import MovieIcon from '@mui/icons-material/Movie';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import RefreshIcon from '@mui/icons-material/Refresh';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import {
  ConfirmDialog,
  FormField,
  Modal,
  SearchField,
  SelectField,
} from '@/components/ui/controls';
import { DataLoader } from '@/components/ui/DataLoader';
import { GuideAccordion, HowRow } from '@/components/ui/Guide';
import { SellerForbidden, useSellerCan } from '@/components/seller/SellerGuards';
import { apiClient } from '@/lib/axios';
import { normaliseApiError } from '@/types/api';
import type { SellerMediaAsset, SellerMediaKind } from '@/types/seller';
import {
  formatBytes,
  uploadMediaFiles,
  useSellerCleanupOrphansMutation,
  useSellerDeleteMediaMutation,
  useSellerMediaQuery,
  useSellerMediaQuotaQuery,
  useSellerUpdateMediaMutation,
} from '@/services/sellerMediaApi';

const PAGE_SIZE = 24;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,application/pdf';
const KIND_LABEL: Record<SellerMediaKind, string> = {
  IMAGE: 'Image',
  VIDEO: 'Video',
  DOCUMENT: 'Document',
  OTHER: 'Other',
};
const MAX_BYTES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  application: 25 * 1024 * 1024,
};

function clientCheck(file: File): string | null {
  const top = file.type.split('/')[0] ?? '';
  if (!ACCEPT.split(',').includes(file.type)) return `"${file.name}" — type ${file.type || 'unknown'} isn't allowed (images, MP4/WebM video, PDF only)`;
  const cap = MAX_BYTES[top] ?? MAX_BYTES.application ?? 0;
  if (file.size > cap) return `"${file.name}" — exceeds the ${formatBytes(cap)} limit`;
  if (file.size === 0) return `"${file.name}" — file is empty`;
  return null;
}

interface PendingUpload {
  key: string;
  name: string;
  size: number;
  percent: number;
  status: 'uploading' | 'done' | 'error' | 'cancelled';
  error?: string;
  abort?: () => void;
}

export function MediaLibraryView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? '';
  const { can } = useSellerCan();
  const canView = can('media:view');
  const canUpload = can('media:upload');
  const canDelete = can('media:delete');

  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState('');
  const [folder, setFolder] = useState('');
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<SellerMediaAsset | null>(null);
  const [deleting, setDeleting] = useState<SellerMediaAsset | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [banner, setBanner] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const listArgs = {
    storeId,
    page,
    limit: PAGE_SIZE,
    search: debounced || undefined,
    kind: (kind || undefined) as SellerMediaKind | undefined,
    folder: folder || undefined,
    orphanOnly: orphanOnly || undefined,
  };
  const { data, isLoading, isError, error, refetch } = useSellerMediaQuery(listArgs, {
    skip: !storeId || !canView,
  });
  const quota = useSellerMediaQuotaQuery(storeId, { skip: !storeId || !canView });
  const [updateMedia, updateState] = useSellerUpdateMediaMutation();
  const [deleteMedia, deleteState] = useSellerDeleteMediaMutation();
  const [cleanupOrphans, cleanupState] = useSellerCleanupOrphansMutation();

  const assets = useMemo(() => data?.data ?? [], [data]);
  const total = data?.pagination.total ?? 0;
  const folders = useMemo(() => {
    const set = new Set(assets.map((a) => a.folder));
    return [...set].sort();
  }, [assets]);

  const startUpload = useCallback(
    (files: File[]) => {
      if (!canUpload || files.length === 0) return;
      setBanner(null);
      const checks = files.map((f) => clientCheck(f));
      const fresh: PendingUpload[] = files.map((f, i) => ({
        key: `${Date.now()}-${f.name}-${f.size}-${i}`,
        name: f.name,
        size: f.size,
        percent: 0,
        status: checks[i] ? ('error' as const) : ('uploading' as const),
        error: checks[i] ?? undefined,
      }));
      setUploads((prev) => [...fresh, ...prev].slice(0, 20));

      const okFiles = files.filter((_, i) => !checks[i]);
      if (okFiles.length === 0) return;

      const keys = fresh.filter((u) => u.status === 'uploading').map((u) => u.key);
      const { promise, abort } = uploadMediaFiles(
        storeId,
        okFiles,
        { folder: folder || 'products' },
        (p) => {
          setUploads((prev) =>
            prev.map((u) => (keys.includes(u.key) ? { ...u, percent: p.percent } : u)),
          );
        },
      );
      setUploads((prev) => prev.map((u) => (keys.includes(u.key) ? { ...u, abort } : u)));
      promise.then(
        (created) => {
          setUploads((prev) =>
            prev.map((u) =>
              keys.includes(u.key) ? { ...u, status: 'done' as const, percent: 100 } : u,
            ),
          );
          const dupes = created.filter((c) => c.deduped).length;
          setBanner({
            tone: 'success',
            text:
              dupes > 0
                ? `${created.length} file(s) ready — ${dupes} already existed (deduplicated).`
                : `${created.length} file(s) uploaded.`,
          });
          refetch();
          quota.refetch();
        },
        (e: Error) => {
          const cancelled = e.message === 'Upload cancelled';
          setUploads((prev) =>
            prev.map((u) =>
              keys.includes(u.key)
                ? { ...u, status: cancelled ? ('cancelled' as const) : ('error' as const), error: e.message }
                : u,
            ),
          );
          if (!cancelled) setBanner({ tone: 'error', text: `Upload failed — ${e.message}` });
        },
      );
    },
    [canUpload, folder, quota, refetch, storeId],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    startUpload([...e.dataTransfer.files].slice(0, 5));
  };

  const downloadAsset = async (asset: SellerMediaAsset) => {
    try {
      const res = await apiClient.get(`/seller/catalog/${storeId}/media/${asset.id}/file`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setBanner({
        tone: 'error',
        text: `Download failed — ${normaliseApiError(e as { status?: number; data?: unknown }).message}`,
      });
    }
  };

  if (!canView) {
    return (
      <Box sx={{ mt: 0.5 }}>
        <SellerForbidden />
      </Box>
    );
  }
  if (isLoading) return <DataLoader label="Loading media library" variant="skeleton" />;
  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" color="inherit" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Couldn&apos;t load media — {normaliseApiError(error as { status?: number; data?: unknown }).message}
      </Alert>
    );
  }

  const q = quota.data?.data;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 0.5,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.4rem' }}>
            Media library
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.86rem', mt: 0.25 }}>
            {total} asset(s) · images, video, and private documents for this store.
          </Typography>
        </Box>
        {q ? (
          <Box sx={{ minWidth: 260, maxWidth: 340, flex: '1 1 260px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="caption" color="text.secondary">
                Storage
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {formatBytes(q.usedBytes)} of {formatBytes(q.limitBytes)} · {q.percent}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, q.percent)}
              color={q.percent >= 90 ? 'error' : q.percent >= 70 ? 'warning' : 'primary'}
              sx={{ mt: 0.5, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Quota follows your plan — {q.assetCount} asset(s) stored. Delete unused files or upgrade to free space.
            </Typography>
          </Box>
        ) : null}
      </Box>

      <GuideAccordion title="How the media library works">
        <HowRow n={1}>Upload images (JPG/PNG/WebP/AVIF/GIF, up to 10 MB), video (MP4/WebM, up to 100 MB), or PDF documents (up to 25 MB).</HowRow>
        <HowRow n={2}>Images and video are public via CDN-style URLs; PDFs always stay private and download through a signed, logged request.</HowRow>
        <HowRow n={3}>Identical files are deduplicated automatically — re-uploading the same photo reuses the stored copy.</HowRow>
        <HowRow n={4}>An asset used by a product can&apos;t be deleted until it&apos;s removed from those listings — the usage badge shows the count.</HowRow>
      </GuideAccordion>

      {banner ? (
        <Alert severity={banner.tone} onClose={() => setBanner(null)}>
          {banner.text}
        </Alert>
      ) : null}

      {canUpload ? (
        <Card
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          sx={{
            border: '1.5px dashed',
            borderColor: dragOver ? 'primary.main' : 'divider',
            bgcolor: dragOver ? 'action.hover' : 'background.paper',
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <CloudUploadIcon color="primary" />
            <Box sx={{ flex: '1 1 240px' }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>
                {dragOver ? 'Drop files to upload (max 5 at once)' : 'Drag & drop files here, or browse'}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                Uploads to folder “{folder || 'products'}” — change the folder filter below to target another folder.
              </Typography>
            </Box>
            <Button size="small" variant="contained" onClick={() => fileInput.current?.click()}>
              Browse files
            </Button>
            <input
              ref={fileInput}
              type="file"
              hidden
              multiple
              accept={ACCEPT}
              onChange={(e) => {
                startUpload([...(e.target.files ?? [])].slice(0, 5));
                e.target.value = '';
              }}
            />
          </Box>
          {uploads.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
              {uploads.slice(0, 6).map((u) => (
                <Box key={u.key}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.8rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name} · {formatBytes(u.size)}
                    </Typography>
                    {u.status === 'uploading' ? (
                      <>
                        <Typography variant="caption" color="text.secondary">{u.percent}%</Typography>
                        <Button size="small" onClick={() => u.abort?.()}>
                          Cancel
                        </Button>
                      </>
                    ) : u.status === 'done' ? (
                      <Chip size="small" label="Ready" color="success" variant="outlined" />
                    ) : u.status === 'cancelled' ? (
                      <Chip size="small" label="Cancelled" variant="outlined" />
                    ) : (
                      <Tooltip title={u.error ?? 'Failed'}>
                        <Chip size="small" label="Failed" color="error" variant="outlined" />
                      </Tooltip>
                    )}
                  </Box>
                  {u.status === 'uploading' ? <LinearProgress variant="determinate" value={u.percent} sx={{ mt: 0.5 }} /> : null}
                  {u.status === 'error' && u.error ? (
                    <Typography variant="caption" color="error">{u.error}</Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          ) : null}
        </Card>
      ) : null}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchField value={search} onChange={setSearch} placeholder="Search filename, alt text…" aria-label="Search media" />
        <SelectField label="Type" value={kind} onChange={(v) => { setKind(v); setPage(1); }} options={Object.keys(KIND_LABEL)} placeholder="All types" minWidth={150} />
        <SelectField label="Folder" value={folder} onChange={(v) => { setFolder(v); setPage(1); }} options={folders} placeholder="All folders" minWidth={150} />
        <Chip
          size="small"
          label="Unused only"
          color={orphanOnly ? 'primary' : 'default'}
          variant={orphanOnly ? 'filled' : 'outlined'}
          onClick={() => { setOrphanOnly((v) => !v); setPage(1); }}
          aria-pressed={orphanOnly}
        />
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" startIcon={<RefreshIcon fontSize="small" />} onClick={() => { refetch(); quota.refetch(); }}>
          Refresh
        </Button>
        {canDelete ? (
          <Button size="small" variant="outlined" startIcon={<CleaningServicesIcon fontSize="small" />} onClick={() => setCleaning(true)}>
            Clean unused…
          </Button>
        ) : null}
      </Box>

      {assets.length === 0 ? (
        <Alert severity="info">
          {total === 0
            ? 'No assets yet — upload your first product photo to get started.'
            : 'No assets match these filters — clear the search or filters.'}
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          }}
        >
          {assets.map((a) => (
            <Card key={a.id} sx={{ display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => canUpload && setEditing(a)} aria-label={`Edit ${a.fileName}`}>
                {a.kind === 'IMAGE' && a.url ? (
                  <CardMedia component="img" image={a.url} alt={a.altText || a.fileName} sx={{ height: 140, objectFit: 'cover' }} loading="lazy" />
                ) : (
                  <Box sx={{ height: 140, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}>
                    {a.kind === 'VIDEO' ? <MovieIcon fontSize="large" /> : a.kind === 'DOCUMENT' ? <PictureAsPdfIcon fontSize="large" /> : <PhotoLibraryIcon fontSize="large" />}
                  </Box>
                )}
              </CardActionArea>
              <CardContent sx={{ p: 1.25, flex: 1 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.originalName}>
                  {a.fileName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
                  <Chip size="small" label={KIND_LABEL[a.kind]} variant="outlined" />
                  {a.visibility === 'PRIVATE' ? <Chip size="small" label="Private" color="warning" variant="outlined" /> : null}
                  {a.usageCount > 0 ? <Chip size="small" label={`Used ×${a.usageCount}`} color="info" variant="outlined" /> : null}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {formatBytes(a.sizeBytes)} · {a.folder} · {new Date(a.createdAt).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
                  {canUpload ? (
                    <Tooltip title="Edit details">
                      <IconButton size="small" onClick={() => setEditing(a)} aria-label={`Edit ${a.fileName}`}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => downloadAsset(a)} aria-label={`Download ${a.fileName}`}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ flex: 1 }} />
                  {canDelete ? (
                    <Tooltip title={a.usageCount > 0 ? `In use ×${a.usageCount} — remove from listings first` : 'Delete'}>
                      <span>
                        <IconButton size="small" disabled={a.usageCount > 0} onClick={() => setDeleting(a)} aria-label={`Delete ${a.fileName}`}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Page {page} · {total} total
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button size="small" variant="outlined" disabled={assets.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </Box>

      <EditAssetDialog
        key={editing?.id ?? 'closed'}
        asset={editing}
        onClose={() => setEditing(null)}
        onSave={async (body) => {
          if (!editing) return;
          await updateMedia({ storeId, id: editing.id, body }).unwrap();
          setEditing(null);
          setBanner({ tone: 'success', text: 'Asset details saved.' });
        }}
        saving={updateState.isLoading}
        saveError={updateState.isError ? normaliseApiError(updateState.error as { status?: number; data?: unknown }).message : null}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this asset?"
        subtitle={deleting?.fileName}
        consequence={`“${deleting?.fileName}” (${deleting ? formatBytes(deleting.sizeBytes) : ''}) will be permanently removed from storage.`}
        description="Safe to delete: it isn't used by any listing (usage ×0). This frees quota immediately and is logged in Activity."
        confirmLabel="Delete asset"
        loading={deleteState.isLoading}
        error={deleteState.isError ? normaliseApiError(deleteState.error as { status?: number; data?: unknown }).message : null}
        onConfirm={async () => {
          if (!deleting) return;
          await deleteMedia({ storeId, id: deleting.id }).unwrap();
          setDeleting(null);
          setBanner({ tone: 'success', text: 'Asset deleted and quota freed.' });
        }}
      />

      <ConfirmDialog
        open={cleaning}
        onClose={() => setCleaning(false)}
        tone="info"
        title="Clean up unused assets?"
        subtitle="Orphan cleanup"
        consequence="Every asset with usage ×0 older than 30 days will be permanently deleted."
        description="Used assets are never touched. Each deletion is logged in Activity with reason “orphan-cleanup”."
        confirmLabel="Clean unused"
        loading={cleanupState.isLoading}
        error={cleanupState.isError ? normaliseApiError(cleanupState.error as { status?: number; data?: unknown }).message : null}
        onConfirm={async () => {
          const res = await cleanupOrphans({ storeId, olderThanDays: 30 }).unwrap();
          setCleaning(false);
          setBanner({
            tone: 'success',
            text: res.data.deleted === 0 ? 'Nothing to clean — no old unused assets.' : `Removed ${res.data.deleted} unused asset(s), freed ${formatBytes(res.data.freedBytes)}.`,
          });
        }}
      />
    </Box>
  );
}

function EditAssetDialog({
  asset,
  onClose,
  onSave,
  saving,
  saveError,
}: {
  asset: SellerMediaAsset | null;
  onClose: () => void;
  onSave: (body: { fileName?: string; altText?: string | null; caption?: string | null; folder?: string; tags?: string[]; visibility?: 'PUBLIC' | 'PRIVATE' }) => Promise<void>;
  saving: boolean;
  saveError: string | null;
}) {
  // Initial state comes from the asset; the parent remounts per asset id
  // (key={editing?.id}) so switching rows never carries stale field values.
  const [fileName, setFileName] = useState(asset?.fileName ?? '');
  const [altText, setAltText] = useState(asset?.altText ?? '');
  const [caption, setCaption] = useState(asset?.caption ?? '');
  const [folder, setFolder] = useState(asset?.folder ?? 'general');
  const [tags, setTags] = useState(asset?.tags.join(', ') ?? '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(asset?.visibility ?? 'PUBLIC');

  return (
    <Modal
      open={!!asset}
      onClose={onClose}
      title="Asset details"
      subtitle={asset?.originalName}
      maxWidth="sm"
      icon={<EditIcon fontSize="small" />}
      actions={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={saving || !fileName.trim()}
            onClick={() =>
              onSave({
                fileName: fileName.trim(),
                altText: altText.trim() || null,
                caption: caption.trim() || null,
                folder: folder.trim() || 'general',
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20),
                visibility,
              })
            }
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      <FormField label="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} hint="Renaming keeps the original extension — only the name part changes." />
      <FormField label="Alt text" value={altText} onChange={(e) => setAltText(e.target.value)} hint="Read by screen readers and used by image search — describe what's shown." />
      <FormField label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} hint="Optional internal note shown under the asset in this library." />
      <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <FormField label="Folder" value={folder} onChange={(e) => setFolder(e.target.value)} hint="Group assets (e.g. products, banners, certificates)." />
        <FormField label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} hint="Up to 20 tags — powers search and smart collections later." />
      </Box>
      <SelectField
        label="Visibility"
        value={visibility}
        onChange={(v) => setVisibility(v === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC')}
        options={['PUBLIC', 'PRIVATE']}
        hint={asset?.kind === 'DOCUMENT' ? 'Documents must stay private — they download through a logged request, never a public URL.' : 'Public assets serve over the CDN path; private ones need a logged download.'}
      />
    </Modal>
  );
}
