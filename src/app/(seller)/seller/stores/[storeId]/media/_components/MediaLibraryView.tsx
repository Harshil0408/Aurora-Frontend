"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import MovieIcon from "@mui/icons-material/Movie";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import RefreshIcon from "@mui/icons-material/Refresh";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import {
  ConfirmDialog,
  FormField,
  Modal,
  SearchField,
  SegmentedFilter,
  SelectField,
  TableCard,
} from "@/components/ui/controls";
import { DataLoader } from "@/components/ui/DataLoader";
import {
  SellerForbidden,
  useSellerCan,
} from "@/components/seller/SellerGuards";
import { apiClient } from "@/lib/axios";
import { mercatoTokens } from "@/lib/theme";
import { normaliseApiError } from "@/types/api";
import type { SellerMediaAsset, SellerMediaKind } from "@/types/seller";
import {
  formatBytes,
  uploadMediaFiles,
  useSellerCleanupOrphansMutation,
  useSellerDeleteMediaMutation,
  useSellerMediaQuery,
  useSellerMediaQuotaQuery,
  useSellerUpdateMediaMutation,
} from "@/services/sellerMediaApi";

const PAGE_SIZE = 24;
const ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,application/pdf";
const KIND_LABEL: Record<SellerMediaKind, string> = {
  IMAGE: "Image",
  VIDEO: "Video",
  DOCUMENT: "Document",
  OTHER: "Other",
};
const MAX_BYTES: Record<string, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  application: 25 * 1024 * 1024,
};

function clientCheck(file: File): string | null {
  const top = file.type.split("/")[0] ?? "";
  if (!ACCEPT.split(",").includes(file.type))
    return `"${file.name}" — type ${file.type || "unknown"} isn't allowed (images, MP4/WebM video, PDF only)`;
  const cap = MAX_BYTES[top] ?? MAX_BYTES.application ?? 0;
  if (file.size > cap)
    return `"${file.name}" — exceeds the ${formatBytes(cap)} limit`;
  if (file.size === 0) return `"${file.name}" — file is empty`;
  return null;
}

interface PendingUpload {
  key: string;
  name: string;
  size: number;
  percent: number;
  status: "uploading" | "done" | "error" | "cancelled";
  error?: string;
  abort?: () => void;
}

type ViewMode = "grid" | "list";
type SortKey = "newest" | "name" | "largest";

function kindIcon(kind: SellerMediaKind, size: "small" | "large" = "small") {
  if (kind === "VIDEO") return <MovieIcon fontSize={size} />;
  if (kind === "DOCUMENT") return <PictureAsPdfIcon fontSize={size} />;
  if (kind === "OTHER") return <PhotoLibraryIcon fontSize={size} />;
  return <ImageRoundedIcon fontSize={size} />;
}

/** Compact label/value row for the preview panel — single-use, stays local. */
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 2,
        py: 0.75,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-child": { borderBottom: 0 },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ flex: "none", fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          minWidth: 0,
          textAlign: "right",
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        {value}
      </Box>
    </Box>
  );
}

/** Merge one server page into the accumulated scroll list (page 1 replaces). */
function mergePage(
  prev: SellerMediaAsset[],
  incoming: SellerMediaAsset[],
  pageNum: number,
): SellerMediaAsset[] {
  if (pageNum <= 1) return incoming;
  if (incoming.length === 0) return prev;
  const fresh = new Map(incoming.map((a) => [a.id, a]));
  const seen = new Set(prev.map((a) => a.id));
  return [
    ...prev.map((a) => fresh.get(a.id) ?? a),
    ...incoming.filter((a) => !seen.has(a.id)),
  ];
}

/** Identity check so identical refetches don't produce a new array (render-loop guard). */
function sameList(a: SellerMediaAsset[], b: SellerMediaAsset[]): boolean {
  return (
    a.length === b.length &&
    a.every((x, i) => b[i] !== undefined && b[i].id === x.id && b[i].updatedAt === x.updatedAt)
  );
}

/** Card-shaped placeholders that mirror the gallery grid (no stray text underneath). */
function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'grid',
        gap: 1.5,
        mt: 1.5,
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} sx={{ p: 0, overflow: 'hidden' }}>
          <Skeleton variant="rectangular" height={148} />
          <Box sx={{ p: 1.25 }}>
            <Skeleton variant="text" height={24} width="80%" />
            <Skeleton variant="text" height={18} width="55%" />
          </Box>
        </Card>
      ))}
    </Box>
  );
}

/** Full-page first-load state — label lives in the accessible name, not under the skeletons. */
function LibrarySkeleton() {
  return (
    <Box
      role="status"
      aria-label="Loading media library"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}
    >
      <Box>
        <Skeleton variant="text" width={220} height={34} />
        <Skeleton variant="text" width={300} height={20} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={92} />
        ))}
      </Box>
      <SkeletonGrid count={8} />
    </Box>
  );
}

/** Small summary tile for the header stat strip. */
function StatTile({
  icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tint: string;
}) {
  return (
    <Card
      sx={{
        p: 1.5,
        display: "flex",
        gap: 1.25,
        alignItems: "flex-start",
        minWidth: 0,
      }}
    >
      <Avatar
        aria-hidden
        sx={{
          width: 36,
          height: 36,
          bgcolor: tint,
          color: mercatoTokens.brandStrong,
          flex: "none",
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontSize: "0.68rem",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: "1.05rem",
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hint}
        </Typography>
      </Box>
    </Card>
  );
}

export function MediaLibraryView() {
  const params = useParams<{ storeId: string }>();
  const storeId = params?.storeId ?? "";
  const { can } = useSellerCan();
  const canView = can("media:view");
  const canUpload = can("media:upload");
  const canDelete = can("media:delete");

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [kind, setKind] = useState("");
  const [folder, setFolder] = useState("");
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<SellerMediaAsset | null>(null);
  const [deleting, setDeleting] = useState<SellerMediaAsset | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [banner, setBanner] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
      setSelectedId(null);
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
  const { data, isLoading, isFetching, isError, error, refetch } =
    useSellerMediaQuery(listArgs, {
      skip: !storeId || !canView,
      refetchOnMountOrArgChange: true,
    });
  const quota = useSellerMediaQuotaQuery(storeId, {
    skip: !storeId || !canView,
  });
  const [updateMedia, updateState] = useSellerUpdateMediaMutation();
  const [deleteMedia, deleteState] = useSellerDeleteMediaMutation();
  const [cleanupOrphans, cleanupState] = useSellerCleanupOrphansMutation();

  // Accumulated scroll list — page 1 replaces, later pages append (deduped).
  const [items, setItems] = useState<SellerMediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync server pages into the accumulated scroll list while rendering
  // (React's "adjust state when props change" pattern — no effect cascade).
  // The fingerprint is content-based so identical refetches never re-sync.
  const fingerprint = data?.data
    ? `${page}|${data.pagination.total ?? 0}|${data.data.map((a) => `${a.id}@${a.updatedAt}`).join(",")}`
    : null;
  const [lastFingerprint, setLastFingerprint] = useState<string | null>(null);
  if (fingerprint && fingerprint !== lastFingerprint) {
    setLastFingerprint(fingerprint);
    setTotal(data?.pagination.total ?? 0);
    setItems((prev) => {
      const next = mergePage(prev, data?.data ?? [], page);
      return sameList(prev, next) ? prev : next;
    });
    if (!hasLoadedOnce) setHasLoadedOnce(true);
  }

  const assets = items;
  const hasMore = items.length < total;
  const isReloading = !!isFetching && !isError && page === 1 && items.length > 0;
  const isAppending = !!isFetching && page > 1;
  const showInitialSkeleton =
    !hasLoadedOnce && items.length === 0 && !!(isLoading || isFetching);
  // True library-empty (no filters) vs. filters that simply match nothing.
  const isPristine = !debounced && !kind && !folder && !orphanOnly;

  // Infinite scroll — advance the page when the sentinel nears the viewport.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isFetching || isError) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setPage((p) => p + 1);
      },
      { rootMargin: "600px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isFetching, isError]);

  const resetToFirstPage = useCallback(() => {
    setPage(1);
    setSelectedId(null);
  }, []);

  const folders = useMemo(() => {
    const set = new Set(items.map((a) => a.folder));
    return [...set].sort();
  }, [items]);

  const sorted = useMemo(() => {
    const rows = [...assets];
    if (sort === "name")
      rows.sort((a, b) => a.fileName.localeCompare(b.fileName));
    else if (sort === "largest") rows.sort((a, b) => b.sizeBytes - a.sizeBytes);
    else rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return rows;
  }, [assets, sort]);

  const selected = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId],
  );

  const unusedOnPage = useMemo(
    () => assets.filter((a) => a.usageCount === 0).length,
    [assets],
  );

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
        status: checks[i] ? ("error" as const) : ("uploading" as const),
        error: checks[i] ?? undefined,
      }));
      setUploads((prev) => [...fresh, ...prev].slice(0, 20));

      const okFiles = files.filter((_, i) => !checks[i]);
      if (okFiles.length === 0) return;

      const keys = fresh
        .filter((u) => u.status === "uploading")
        .map((u) => u.key);
      const { promise, abort } = uploadMediaFiles(
        storeId,
        okFiles,
        { folder: folder || "products" },
        (p) => {
          setUploads((prev) =>
            prev.map((u) =>
              keys.includes(u.key) ? { ...u, percent: p.percent } : u,
            ),
          );
        },
      );
      setUploads((prev) =>
        prev.map((u) => (keys.includes(u.key) ? { ...u, abort } : u)),
      );
      promise.then(
        (created) => {
          setUploads((prev) =>
            prev.map((u) =>
              keys.includes(u.key)
                ? { ...u, status: "done" as const, percent: 100 }
                : u,
            ),
          );
          const dupes = created.filter((c) => c.deduped).length;
          setBanner({
            tone: "success",
            text:
              dupes > 0
                ? `${created.length} file(s) ready — ${dupes} already existed (deduplicated).`
                : `${created.length} file(s) uploaded.`,
          });
          // Restart from page 1 so the fresh files land on top; the arg
          // change (or the explicit refetch when already on page 1) reloads.
          setPage(1);
          setSelectedId(null);
          refetch();
          quota.refetch();
        },
        (e: Error) => {
          const cancelled = e.message === "Upload cancelled";
          setUploads((prev) =>
            prev.map((u) =>
              keys.includes(u.key)
                ? {
                    ...u,
                    status: cancelled
                      ? ("cancelled" as const)
                      : ("error" as const),
                    error: e.message,
                  }
                : u,
            ),
          );
          if (!cancelled)
            setBanner({ tone: "error", text: `Upload failed — ${e.message}` });
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
      const res = await apiClient.get(
        `/seller/catalog/${storeId}/media/${asset.id}/file`,
        {
          responseType: "blob",
        },
      );
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      setBanner({
        tone: "error",
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
  // Full error only when there is nothing to show; refresh failures with
  // stale items surface as an inline alert above the list instead.
  if (isError && items.length === 0 && !isFetching) {
    return (
      <Alert
        severity="error"
        action={
          <Button size="small" color="inherit" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Couldn&apos;t load media —{" "}
        {
          normaliseApiError(error as { status?: number; data?: unknown })
            .message
        }
      </Alert>
    );
  }
  if (showInitialSkeleton) return <LibrarySkeleton />;

  const q = quota.data?.data;
  const quotaPct = q ? Math.min(100, q.percent) : 0;
  const quotaTone =
    quotaPct >= 90
      ? mercatoTokens.bad
      : quotaPct >= 70
        ? mercatoTokens.accentStrong
        : mercatoTokens.brand;

  const thumb = (a: SellerMediaAsset, height: number) =>
    a.kind === "IMAGE" && a.url ? (
      <Box
        component="img"
        src={a.url}
        alt={a.altText || a.fileName}
        loading="lazy"
        sx={{ width: "100%", height, objectFit: "cover", display: "block" }}
      />
    ) : (
      <Box
        aria-hidden
        sx={{
          height,
          display: "grid",
          placeItems: "center",
          color: mercatoTokens.brandStrong,
          background: `linear-gradient(135deg, ${mercatoTokens.brandSoft} 0%, ${mercatoTokens.surface2} 70%)`,
        }}
      >
        {a.kind === "VIDEO" ? (
          <MovieIcon fontSize="large" />
        ) : a.kind === "DOCUMENT" ? (
          <PictureAsPdfIcon fontSize="large" />
        ) : (
          <PhotoLibraryIcon fontSize="large" />
        )}
      </Box>
    );

  const kindChip = (a: SellerMediaAsset) => (
    <Chip
      size="small"
      icon={kindIcon(a.kind)}
      label={KIND_LABEL[a.kind]}
      variant="outlined"
      sx={{ bgcolor: "background.paper", fontWeight: 700 }}
    />
  );

  const rowActions = (a: SellerMediaAsset) => (
    <>
      {canUpload ? (
        <Tooltip title="Edit details">
          <IconButton
            size="small"
            onClick={() => setEditing(a)}
            aria-label={`Edit ${a.fileName}`}
            sx={{ cursor: "pointer" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      <Tooltip title="Download">
        <IconButton
          size="small"
          onClick={() => downloadAsset(a)}
          aria-label={`Download ${a.fileName}`}
          sx={{ cursor: "pointer" }}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1 }} />
      {canDelete ? (
        <Tooltip
          title={
            a.usageCount > 0
              ? `In use ×${a.usageCount} — remove from listings first`
              : "Delete"
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={a.usageCount > 0}
              onClick={() => setDeleting(a)}
              aria-label={`Delete ${a.fileName}`}
              sx={{ cursor: a.usageCount > 0 ? "not-allowed" : "pointer" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
    </>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
      {/* Compact header — title left, primary actions right */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1" sx={{ fontSize: "1.4rem" }}>
            Media library
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: "0.86rem", mt: 0.25 }}
          >
            {total} asset(s) · images, video, and private documents for this
            store.
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon fontSize="small" />}
            onClick={() => {
              refetch();
              quota.refetch();
            }}
          >
            Refresh
          </Button>
          {canDelete ? (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CleaningServicesIcon fontSize="small" />}
              onClick={() => setCleaning(true)}
            >
              Clean unused…
            </Button>
          ) : null}
          {canUpload ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<CloudUploadIcon fontSize="small" />}
              onClick={() => fileInput.current?.click()}
            >
              Upload
            </Button>
          ) : null}
        </Box>
      </Box>

      {/* Summary strip — four compact tiles */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "repeat(4, 1fr)",
          },
        }}
      >
        <StatTile
          icon={<PhotoLibraryIcon fontSize="small" />}
          label="Library"
          value={`${total} asset(s)`}
          hint={`${folders.length} folder(s) · ${items.length} of ${total} shown`}
          tint={mercatoTokens.brandSoft}
        />
        <Card
          sx={{
            p: 1.5,
            display: "flex",
            gap: 1.25,
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <Avatar
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              bgcolor: mercatoTokens.infoSoft,
              color: mercatoTokens.info,
              flex: "none",
            }}
          >
            <StorageRoundedIcon fontSize="small" />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "0.68rem",
              }}
            >
              Storage
            </Typography>
            <Typography
              sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.25 }}
            >
              {q
                ? `${formatBytes(q.usedBytes)} of ${formatBytes(q.limitBytes)}`
                : "—"}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={quotaPct}
              aria-label={`Storage ${quotaPct}% used`}
              sx={{
                mt: 0.75,
                height: 8,
                borderRadius: 9999,
                bgcolor: mercatoTokens.surface2,
                "& .MuiLinearProgress-bar": {
                  bgcolor: quotaTone,
                  borderRadius: 9999,
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              {q
                ? `${quotaPct}% used · ${q.assetCount} stored`
                : "Quota follows your plan"}
            </Typography>
          </Box>
        </Card>
        <StatTile
          icon={<FolderRoundedIcon fontSize="small" />}
          label="Folders"
          value={folder || "All folders"}
          hint={
            folders.length > 0
              ? folders.slice(0, 3).join(" · ") +
                (folders.length > 3 ? " …" : "")
              : "Uploads land in “products”"
          }
          tint={mercatoTokens.accentSoft}
        />
        <StatTile
          icon={<VisibilityRoundedIcon fontSize="small" />}
          label="Attention"
          value={`${unusedOnPage} unused in view`}
          hint="Unused files are safe to clean up"
          tint={mercatoTokens.goodSoft}
        />
      </Box>

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
            p: 2,
            border: "1.5px dashed",
            borderColor: dragOver ? mercatoTokens.brand : "divider",
            bgcolor: dragOver ? mercatoTokens.brandSoft : "background.paper",
            boxShadow: dragOver ? mercatoTokens.shadow2 : mercatoTokens.shadow1,
            transition:
              "border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", lg: "5fr 7fr" },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <Avatar
                aria-hidden
                sx={{
                  width: 44,
                  height: 44,
                  bgcolor: mercatoTokens.brandSoft,
                  color: mercatoTokens.brandStrong,
                  flex: "none",
                }}
              >
                <CloudUploadIcon />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {dragOver
                    ? "Drop files to upload (max 5 at once)"
                    : "Drag & drop files here, or browse"}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem", mt: 0.25 }}
                >
                  What it is — the intake tray for product imagery. Files land
                  in folder “{folder || "products"}”.
                </Typography>
                <Box
                  sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.75 }}
                >
                  <Chip
                    size="small"
                    label="Images · 10 MB"
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label="Video · 100 MB"
                    variant="outlined"
                  />
                  <Chip size="small" label="PDF · 25 MB" variant="outlined" />
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: { xs: "flex-start", lg: "flex-end" },
                flexWrap: "wrap",
              }}
            >
              <SelectField
                label="Target folder"
                value={folder}
                onChange={(v) => {
                  setFolder(v);
                  resetToFirstPage();
                }}
                options={folders.length > 0 ? folders : ["products"]}
                placeholder="products"
                minWidth={160}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => fileInput.current?.click()}
              >
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
                  e.target.value = "";
                }}
              />
            </Box>
          </Box>
          {uploads.length > 0 ? (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}
            >
              {uploads.slice(0, 6).map((u) => (
                <Box
                  key={u.key}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: mercatoTokens.surface2,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {u.status === "done" ? (
                      <CheckCircleRoundedIcon
                        fontSize="small"
                        sx={{ color: mercatoTokens.good }}
                      />
                    ) : u.status === "error" ? (
                      <ErrorRoundedIcon
                        fontSize="small"
                        sx={{ color: mercatoTokens.bad }}
                      />
                    ) : (
                      <CloudUploadIcon fontSize="small" color="primary" />
                    )}
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.name} · {formatBytes(u.size)}
                    </Typography>
                    {u.status === "uploading" ? (
                      <>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {u.percent}%
                        </Typography>
                        <Button size="small" onClick={() => u.abort?.()}>
                          Cancel
                        </Button>
                      </>
                    ) : u.status === "done" ? (
                      <Chip
                        size="small"
                        label="Ready"
                        sx={{
                          bgcolor: mercatoTokens.goodSoft,
                          color: mercatoTokens.good,
                          fontWeight: 700,
                        }}
                      />
                    ) : u.status === "cancelled" ? (
                      <Chip size="small" label="Cancelled" variant="outlined" />
                    ) : (
                      <Tooltip title={u.error ?? "Failed"}>
                        <Chip
                          size="small"
                          label="Failed"
                          sx={{
                            bgcolor: mercatoTokens.badSoft,
                            color: mercatoTokens.bad,
                            fontWeight: 700,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  {u.status === "uploading" ? (
                    <LinearProgress
                      variant="determinate"
                      value={u.percent}
                      sx={{
                        mt: 0.75,
                        height: 6,
                        borderRadius: 9999,
                        bgcolor: "background.paper",
                        "& .MuiLinearProgress-bar": { borderRadius: 9999 },
                      }}
                    />
                  ) : null}
                  {u.status === "error" && u.error ? (
                    <Typography variant="caption" color="error">
                      {u.error}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Box>
          ) : null}
        </Card>
      ) : null}

      {/* Reload signal — stale list stays visible but dimmed while refetching */}
      {isReloading && (
        <LinearProgress
          aria-label="Refreshing media"
          sx={{ height: 4, borderRadius: 9999 }}
        />
      )}
      {isError && items.length > 0 && (
        <Alert
          severity="error"
          action={
            <Button size="small" color="inherit" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Couldn&apos;t refresh media —{" "}
          {
            normaliseApiError(error as { status?: number; data?: unknown })
              .message
          }
        </Alert>
      )}

      {/* Library shell — filters stay visible even when empty */}
      <TableCard
        title="Assets"
        subtitle={`${total} total · ${assets.length} shown`}
        actions={
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              p: 0.5,
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              bgcolor: mercatoTokens.surface2,
            }}
            role="group"
            aria-label="Layout"
          >
            <Tooltip title="Grid view">
              <IconButton
                size="small"
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
                sx={{
                  cursor: "pointer",
                  bgcolor: view === "grid" ? "background.paper" : "transparent",
                  boxShadow: view === "grid" ? 1 : 0,
                }}
              >
                <GridViewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List view">
              <IconButton
                size="small"
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
                sx={{
                  cursor: "pointer",
                  bgcolor: view === "list" ? "background.paper" : "transparent",
                  boxShadow: view === "list" ? 1 : 0,
                }}
              >
                <ViewListRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        toolbar={
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search filename, alt text…"
              aria-label="Search media"
              minWidth={220}
            />
            <SegmentedFilter
              ariaLabel="Filter by type"
              value={kind as "" | "IMAGE" | "VIDEO" | "DOCUMENT"}
              onChange={(v) => {
                setKind(v);
                resetToFirstPage();
              }}
              options={[
                { value: "", label: "All" },
                { value: "IMAGE", label: "Images", dot: mercatoTokens.brand },
                { value: "VIDEO", label: "Video", dot: mercatoTokens.info },
                {
                  value: "DOCUMENT",
                  label: "Docs",
                  dot: mercatoTokens.accentStrong,
                },
              ]}
            />
            <SelectField
              label="Folder"
              value={folder}
              onChange={(v) => {
                setFolder(v);
                resetToFirstPage();
              }}
              options={folders}
              placeholder="All folders"
              minWidth={150}
            />
            <SelectField
              label="Sort"
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              options={[
                { value: "newest", label: "Newest" },
                { value: "name", label: "Name A–Z" },
                { value: "largest", label: "Largest" },
              ]}
              minWidth={130}
            />
            <Chip
              size="small"
              label="Unused only"
              color={orphanOnly ? "primary" : "default"}
              variant={orphanOnly ? "filled" : "outlined"}
              onClick={() => {
                setOrphanOnly((v) => !v);
                resetToFirstPage();
              }}
              aria-pressed={orphanOnly}
              sx={{ cursor: "pointer" }}
            />
          </Box>
        }
        empty={{
          when: assets.length === 0 && !isFetching && !isLoading,
          title:
            total === 0 && isPristine
              ? "No assets yet"
              : "No matches for these filters",
          description:
            total === 0 && isPristine
              ? "Upload your first product photo to get started — it will appear here with CDN URL, usage, and quota impact."
              : "Clear the search or switch the type and folder filters to see more of your library.",
          actionLabel:
            total === 0 && isPristine && canUpload ? "Browse files" : undefined,
          onAction:
            total === 0 && isPristine && canUpload
              ? () => fileInput.current?.click()
              : undefined,
        }}
        footer={
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              width: "100%",
            }}
          >
            <Box ref={sentinelRef} aria-hidden sx={{ height: 2 }} />
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Showing {items.length} of {total} asset(s)
              </Typography>
              <Box sx={{ flex: 1 }} />
              {isAppending ? (
                <DataLoader variant="inline" label="Loading more media" />
              ) : hasMore ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load more
                </Button>
              ) : items.length > 0 ? (
                <Typography variant="caption" color="text.secondary">
                  You&apos;re all caught up
                </Typography>
              ) : null}
            </Box>
          </Box>
        }
      >
        {assets.length === 0 ? (
          isFetching || isLoading ? (
            <Box role="status" aria-label="Loading media">
              <SkeletonGrid count={4} />
            </Box>
          ) : null
        ) : (
          <Box
            aria-busy={isReloading}
            sx={{
              display: "grid",
              gap: 1.5,
              mt: 1.5,
              opacity: isReloading ? 0.55 : 1,
              transition: "opacity 200ms ease",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
              gridTemplateColumns: selected
                ? { xs: "1fr", xl: "1fr 340px" }
                : "1fr",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {view === "grid" ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                  }}
                >
                  {sorted.map((a) => {
                    const active = selected?.id === a.id;
                    return (
                      <Card
                        key={a.id}
                        onClick={() => setSelectedId(active ? null : a.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(active ? null : a.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={active}
                        aria-label={`Preview ${a.fileName}`}
                        sx={{
                          p: 0,
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          borderColor: active ? mercatoTokens.brand : "divider",
                          borderWidth: active ? 2 : 1,
                          boxShadow: active
                            ? mercatoTokens.shadow2
                            : mercatoTokens.shadow1,
                          transform: active ? "translateY(-2px)" : "none",
                          transition:
                            "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: mercatoTokens.shadow2,
                            borderColor: mercatoTokens.brand,
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${mercatoTokens.brand}`,
                            outlineOffset: 2,
                          },
                          "@media (prefers-reduced-motion: reduce)": {
                            transition: "none",
                            transform: "none",
                            "&:hover": { transform: "none" },
                          },
                        }}
                      >
                        <Box sx={{ position: "relative" }}>
                          {thumb(a, 148)}
                          {/* Hover overlay — progressive enhancement; actions also live below for touch */}
                          <Box
                            className="asset-overlay"
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                              opacity: 0,
                              background:
                                "linear-gradient(180deg, rgba(12,10,9,0.0) 20%, rgba(12,10,9,0.55) 100%)",
                              transition: "opacity 200ms ease",
                              ".MuiCard-root:hover &, .MuiCard-root:focus-within &":
                                { opacity: 1 },
                              "@media (hover: none)": { display: "none" },
                              "@media (prefers-reduced-motion: reduce)": {
                                transition: "none",
                              },
                            }}
                          >
                            <Tooltip title="Preview">
                              <IconButton
                                size="small"
                                aria-label={`Preview ${a.fileName}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(a.id);
                                }}
                                sx={{
                                  cursor: "pointer",
                                  bgcolor: "rgba(255,255,255,0.92)",
                                  "&:hover": { bgcolor: "#fff" },
                                }}
                              >
                                <VisibilityRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canUpload ? (
                              <Tooltip title="Edit details">
                                <IconButton
                                  size="small"
                                  aria-label={`Edit ${a.fileName}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing(a);
                                  }}
                                  sx={{
                                    cursor: "pointer",
                                    bgcolor: "rgba(255,255,255,0.92)",
                                    "&:hover": { bgcolor: "#fff" },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : null}
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                aria-label={`Download ${a.fileName}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadAsset(a);
                                }}
                                sx={{
                                  cursor: "pointer",
                                  bgcolor: "rgba(255,255,255,0.92)",
                                  "&:hover": { bgcolor: "#fff" },
                                }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              display: "flex",
                              gap: 0.5,
                            }}
                          >
                            {kindChip(a)}
                          </Box>
                          {a.usageCount > 0 ? (
                            <Chip
                              size="small"
                              label={`Used ×${a.usageCount}`}
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: mercatoTokens.infoSoft,
                                color: mercatoTokens.info,
                                fontWeight: 800,
                              }}
                            />
                          ) : null}
                        </Box>
                        <Box
                          sx={{
                            p: 1.25,
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: "0.84rem",
                              fontWeight: 700,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={a.originalName}
                          >
                            {a.fileName}
                          </Typography>
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {a.visibility === "PRIVATE" ? (
                              <Chip
                                size="small"
                                label="Private"
                                sx={{
                                  bgcolor: mercatoTokens.accentSoft,
                                  color: mercatoTokens.accentStrong,
                                  fontWeight: 700,
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label="Public"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                            <Chip
                              size="small"
                              label={a.folder}
                              variant="outlined"
                              sx={{ fontWeight: 600, maxWidth: 120 }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {formatBytes(a.sizeBytes)} ·{" "}
                            {new Date(a.createdAt).toLocaleDateString()}
                          </Typography>
                          <Divider sx={{ my: 0.25 }} />
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.25,
                              alignItems: "center",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rowActions(a)}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {sorted.map((a) => {
                    const active = selected?.id === a.id;
                    return (
                      <Card
                        key={a.id}
                        onClick={() => setSelectedId(active ? null : a.id)}
                        sx={{
                          p: 1.25,
                          display: "flex",
                          gap: 1.5,
                          alignItems: "center",
                          cursor: "pointer",
                          borderColor: active ? mercatoTokens.brand : "divider",
                          borderWidth: active ? 2 : 1,
                          transition:
                            "border-color 200ms ease, box-shadow 200ms ease",
                          "&:hover": {
                            borderColor: mercatoTokens.brand,
                            boxShadow: mercatoTokens.shadow2,
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${mercatoTokens.brand}`,
                            outlineOffset: 2,
                          },
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={active}
                        aria-label={`Preview ${a.fileName}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(active ? null : a.id);
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            overflow: "hidden",
                            flex: "none",
                            border: 1,
                            borderColor: "divider",
                            bgcolor: mercatoTokens.surface2,
                          }}
                        >
                          {thumb(a, 56)}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: "0.86rem",
                              fontWeight: 700,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={a.originalName}
                          >
                            {a.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatBytes(a.sizeBytes)} · {a.folder} ·{" "}
                            {new Date(a.createdAt).toLocaleDateString()}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                              mt: 0.5,
                            }}
                          >
                            {kindChip(a)}
                            {a.visibility === "PRIVATE" ? (
                              <Chip
                                size="small"
                                label="Private"
                                sx={{
                                  bgcolor: mercatoTokens.accentSoft,
                                  color: mercatoTokens.accentStrong,
                                  fontWeight: 700,
                                }}
                              />
                            ) : null}
                            {a.usageCount > 0 ? (
                              <Chip
                                size="small"
                                label={`Used ×${a.usageCount}`}
                                sx={{
                                  bgcolor: mercatoTokens.infoSoft,
                                  color: mercatoTokens.info,
                                  fontWeight: 700,
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label="Unused"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.25,
                            alignItems: "center",
                            flex: "none",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {rowActions(a)}
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>

            {selected ? (
              <Card
                sx={{
                  p: 0,
                  overflow: "hidden",
                  alignSelf: "start",
                  position: "sticky",
                  top: 12,
                }}
                aria-label={`Details for ${selected.fileName}`}
              >
                <Box sx={{ position: "relative" }}>{thumb(selected, 220)}</Box>
                <Box sx={{ p: 1.75 }}>
                  <Box
                    sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={selected.originalName}
                      >
                        {selected.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {KIND_LABEL[selected.kind]} ·{" "}
                        {formatBytes(selected.sizeBytes)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      aria-label="Close preview"
                      onClick={() => setSelectedId(null)}
                      sx={{ cursor: "pointer" }}
                    >
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box
                    sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}
                  >
                    {kindChip(selected)}
                    {selected.visibility === "PRIVATE" ? (
                      <Chip
                        size="small"
                        label="Private"
                        sx={{
                          bgcolor: mercatoTokens.accentSoft,
                          color: mercatoTokens.accentStrong,
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <Chip
                        size="small"
                        label="Public CDN"
                        sx={{
                          bgcolor: mercatoTokens.goodSoft,
                          color: mercatoTokens.good,
                          fontWeight: 700,
                        }}
                      />
                    )}
                    {selected.usageCount > 0 ? (
                      <Chip
                        size="small"
                        label={`Used ×${selected.usageCount}`}
                        sx={{
                          bgcolor: mercatoTokens.infoSoft,
                          color: mercatoTokens.info,
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <Chip size="small" label="Unused" variant="outlined" />
                    )}
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <DetailRow label="Folder" value={selected.folder} />
                    <DetailRow
                      label="Uploaded"
                      value={new Date(selected.createdAt).toLocaleString()}
                    />
                    <DetailRow
                      label="Usage"
                      value={
                        selected.usageCount > 0
                          ? `In ${selected.usageCount} listing(s)`
                          : "Not used anywhere"
                      }
                    />
                    <DetailRow
                      label="Alt text"
                      value={selected.altText || "—"}
                    />
                    <DetailRow
                      label="Tags"
                      value={
                        selected.tags.length > 0
                          ? selected.tags.join(", ")
                          : "—"
                      }
                    />
                  </Box>
                  {selected.caption ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      {selected.caption}
                    </Typography>
                  ) : null}
                  <Box
                    sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}
                  >
                    {canUpload ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => setEditing(selected)}
                      >
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon fontSize="small" />}
                      onClick={() => downloadAsset(selected)}
                    >
                      Download
                    </Button>
                    {canDelete ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon fontSize="small" />}
                        disabled={selected.usageCount > 0}
                        onClick={() => setDeleting(selected)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </Box>
                  {selected.usageCount > 0 ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      In use — remove it from its listings before deleting.
                    </Typography>
                  ) : null}
                </Box>
              </Card>
            ) : null}
          </Box>
        )}
      </TableCard>

      <EditAssetDialog
        key={editing?.id ?? "closed"}
        asset={editing}
        onClose={() => setEditing(null)}
        onSave={async (body) => {
          if (!editing) return;
          await updateMedia({ storeId, id: editing.id, body }).unwrap();
          setEditing(null);
          setBanner({ tone: "success", text: "Asset details saved." });
        }}
        saving={updateState.isLoading}
        saveError={
          updateState.isError
            ? normaliseApiError(
                updateState.error as { status?: number; data?: unknown },
              ).message
            : null
        }
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete this asset?"
        subtitle={deleting?.fileName}
        consequence={`“${deleting?.fileName}” (${deleting ? formatBytes(deleting.sizeBytes) : ""}) will be permanently removed from storage.`}
        description="Safe to delete: it isn't used by any listing (usage ×0). This frees quota immediately and is logged in Activity."
        confirmLabel="Delete asset"
        loading={deleteState.isLoading}
        error={
          deleteState.isError
            ? normaliseApiError(
                deleteState.error as { status?: number; data?: unknown },
              ).message
            : null
        }
        onConfirm={async () => {
          if (!deleting) return;
          const removedId = deleting.id;
          await deleteMedia({ storeId, id: removedId }).unwrap();
          setDeleting(null);
          // Drop locally so the row vanishes instantly; the background
          // page refetch (tag invalidation) upserts the rest without a flash.
          setItems((prev) => prev.filter((a) => a.id !== removedId));
          setTotal((t) => Math.max(0, t - 1));
          setSelectedId((id) => (id === removedId ? null : id));
          setBanner({
            tone: "success",
            text: "Asset deleted and quota freed.",
          });
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
        error={
          cleanupState.isError
            ? normaliseApiError(
                cleanupState.error as { status?: number; data?: unknown },
              ).message
            : null
        }
        onConfirm={async () => {
          const res = await cleanupOrphans({
            storeId,
            olderThanDays: 30,
          }).unwrap();
          setCleaning(false);
          // Bulk removal shifts every page — restart from the top.
          setPage(1);
          setSelectedId(null);
          setBanner({
            tone: "success",
            text:
              res.data.deleted === 0
                ? "Nothing to clean — no old unused assets."
                : `Removed ${res.data.deleted} unused asset(s), freed ${formatBytes(res.data.freedBytes)}.`,
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
  onSave: (body: {
    fileName?: string;
    altText?: string | null;
    caption?: string | null;
    folder?: string;
    tags?: string[];
    visibility?: "PUBLIC" | "PRIVATE";
  }) => Promise<void>;
  saving: boolean;
  saveError: string | null;
}) {
  // Initial state comes from the asset; the parent remounts per asset id
  // (key={editing?.id}) so switching rows never carries stale field values.
  const [fileName, setFileName] = useState(asset?.fileName ?? "");
  const [altText, setAltText] = useState(asset?.altText ?? "");
  const [caption, setCaption] = useState(asset?.caption ?? "");
  const [folder, setFolder] = useState(asset?.folder ?? "general");
  const [tags, setTags] = useState(asset?.tags.join(", ") ?? "");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    asset?.visibility ?? "PUBLIC",
  );

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
                folder: folder.trim() || "general",
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .slice(0, 20),
                visibility,
              })
            }
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {saveError ? <Alert severity="error">{saveError}</Alert> : null}
      {asset?.kind === "IMAGE" && asset.url ? (
        <Box
          component="img"
          src={asset.url}
          alt={asset.altText || asset.fileName}
          sx={{
            width: "100%",
            height: 160,
            objectFit: "cover",
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            display: "block",
          }}
        />
      ) : null}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700 }}
      >
        Step 1 — Name & describe (powers search and screen readers)
      </Typography>
      <FormField
        label="File name"
        value={fileName}
        onChange={(e) => setFileName(e.target.value)}
        hint="Renaming keeps the original extension — only the name part changes."
      />
      <FormField
        label="Alt text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        hint="Read by screen readers and used by image search — describe what's shown."
      />
      <FormField
        label="Caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        hint="Optional internal note shown under the asset in this library."
      />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700 }}
      >
        Step 2 — Organise & publish
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <FormField
          label="Folder"
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          hint="Group assets (e.g. products, banners, certificates)."
        />
        <FormField
          label="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          hint="Up to 20 tags — powers search and smart collections later."
        />
      </Box>
      <SelectField
        label="Visibility"
        value={visibility}
        onChange={(v) => setVisibility(v === "PRIVATE" ? "PRIVATE" : "PUBLIC")}
        options={["PUBLIC", "PRIVATE"]}
        hint={
          asset?.kind === "DOCUMENT"
            ? "Documents must stay private — they download through a logged request, never a public URL."
            : "Public assets serve over the CDN path; private ones need a logged download."
        }
      />
    </Modal>
  );
}
