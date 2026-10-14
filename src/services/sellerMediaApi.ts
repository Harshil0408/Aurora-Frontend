import { api } from '@/services/api';
import { config } from '@/lib/config';
import { tokenManager } from '@/lib/tokenManager';
import type { ApiSuccess } from '@/types/api';
import type {
  SellerMediaAsset,
  SellerMediaListParams,
  SellerMediaQuota,
  UpdateMediaRequest,
} from '@/types/seller';

export interface SellerMediaPage extends ApiSuccess<(SellerMediaAsset & { deduped?: boolean })[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Seller media library (backend: `/api/v1/seller/catalog/:storeId/media*`). */
export const sellerMediaApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerMedia: build.query<SellerMediaPage, SellerMediaListParams>({
      query: ({ storeId, ...params }) => ({
        url: `/seller/catalog/${storeId}/media`,
        method: 'GET',
        params: params as Record<string, string | number | boolean | undefined>,
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerMedia', id: storeId }],
    }),
    sellerMediaQuota: build.query<ApiSuccess<SellerMediaQuota>, string>({
      query: (storeId) => ({ url: `/seller/catalog/${storeId}/media/quota`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerMedia', id: `${storeId}:quota` }],
    }),
    sellerUpdateMedia: build.mutation<
      ApiSuccess<SellerMediaAsset>,
      { storeId: string; id: string; body: UpdateMediaRequest }
    >({
      query: ({ storeId, id, body }) => ({
        url: `/seller/catalog/${storeId}/media/${id}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerMedia', id: storeId }],
    }),
    sellerDeleteMedia: build.mutation<ApiSuccess<{ id: string }>, { storeId: string; id: string }>({
      query: ({ storeId, id }) => ({
        url: `/seller/catalog/${storeId}/media/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerMedia', id: storeId },
        { type: 'SellerMedia', id: `${storeId}:quota` },
      ],
    }),
    sellerCleanupOrphans: build.mutation<
      ApiSuccess<{ deleted: number; freedBytes: number }>,
      { storeId: string; olderThanDays?: number }
    >({
      query: ({ storeId, olderThanDays = 30 }) => ({
        url: `/seller/catalog/${storeId}/media/orphans/cleanup`,
        method: 'POST',
        params: { olderThanDays },
      }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerMedia', id: storeId },
        { type: 'SellerMedia', id: `${storeId}:quota` },
      ],
    }),
  }),
});

export const {
  useSellerMediaQuery,
  useSellerMediaQuotaQuery,
  useSellerUpdateMediaMutation,
  useSellerDeleteMediaMutation,
  useSellerCleanupOrphansMutation,
} = sellerMediaApi;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Multipart upload with real progress + cancel. RTK Query/axios carry a
 * JSON default content-type and a 15s timeout, so uploads go through a raw
 * XHR instead: the browser sets the multipart boundary, the BFF forwards
 * raw bytes, and multer parses server-side.
 */
export function uploadMediaFiles(
  storeId: string,
  files: File[],
  meta: { folder?: string; altText?: string; tags?: string; visibility?: 'PUBLIC' | 'PRIVATE' },
  onProgress: (p: UploadProgress) => void,
): { promise: Promise<(SellerMediaAsset & { deduped?: boolean })[]>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const form = new FormData();
  for (const f of files) form.append('files', f, f.name);
  if (meta.folder) form.append('folder', meta.folder);
  if (meta.altText) form.append('altText', meta.altText);
  if (meta.tags) form.append('tags', meta.tags);
  if (meta.visibility) form.append('visibility', meta.visibility);

  const promise = new Promise<(SellerMediaAsset & { deduped?: boolean })[]>((resolve, reject) => {
    xhr.open('POST', `${config.apiProxyBase}/seller/catalog/${storeId}/media`);
    xhr.withCredentials = true;
    xhr.timeout = 10 * 60 * 1000;
    const token = tokenManager.getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    try {
      xhr.setRequestHeader('x-request-id', crypto.randomUUID());
    } catch {
      /* non-secure contexts — backend mints one */
    }
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      onProgress({ loaded: e.loaded, total: e.total, percent: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as {
          success: boolean;
          data?: (SellerMediaAsset & { deduped?: boolean })[];
          error?: { message?: string };
        };
        if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) resolve(body.data);
        else reject(new Error(body.error?.message ?? `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out — try smaller files'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
