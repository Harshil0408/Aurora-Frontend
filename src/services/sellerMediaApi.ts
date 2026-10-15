import { api } from '@/services/api';
import { formatBytes, uploadFilesXHR, type UploadProgress } from '@/lib/upload';
import type { ApiSuccess } from '@/types/api';

export type { UploadProgress };
export { formatBytes };
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

/**
 * Store media upload with real progress + cancel (multipart via XHR —
 * see `@/lib/upload` for why RTK Query/axios can't carry this).
 */
export function uploadMediaFiles(
  storeId: string,
  files: File[],
  meta: { folder?: string; altText?: string; tags?: string; visibility?: 'PUBLIC' | 'PRIVATE' },
  onProgress: (p: UploadProgress) => void,
): { promise: Promise<(SellerMediaAsset & { deduped?: boolean })[]>; abort: () => void } {
  const extra: Record<string, string> = {};
  if (meta.folder) extra.folder = meta.folder;
  if (meta.altText) extra.altText = meta.altText;
  if (meta.tags) extra.tags = meta.tags;
  if (meta.visibility) extra.visibility = meta.visibility;
  return uploadFilesXHR<(SellerMediaAsset & { deduped?: boolean })[]>({
    url: `/seller/catalog/${storeId}/media`,
    files,
    field: 'files',
    extra,
    onProgress,
  });
}
