import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  AdminAuthQueueItem,
  AdminBrandRequestItem,
  ApprovalState,
  Brand,
  BrandDetail,
  BrandImportCommit,
  BrandImportPreview,
  BrandImportRow,
  BrandStatus,
  CreateBrandRequest,
  MergeBrandResponse,
  ReviewBrandAuthorisation,
  ReviewBrandRequest,
  UpdateBrandRequest,
} from '@/types/brands';

/** Admin brand master (backend: `/api/v1/admin/brands*`). */
export const brandsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listBrands: build.query<
      ApiPaginated<Brand>,
      { page?: number; limit?: number; search?: string; status?: BrandStatus; restricted?: boolean; featured?: boolean }
    >({
      query: (args) => ({
        url: '/admin/brands',
        method: 'GET',
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          search: args.search,
          status: args.status,
          restricted: args.restricted,
          featured: args.featured,
        },
      }),
      providesTags: ['Brands'],
    }),
    brandDetail: build.query<ApiSuccess<BrandDetail>, string>({
      query: (id) => ({ url: `/admin/brands/${id}`, method: 'GET' }),
      providesTags: (_res, _err, id) => [{ type: 'Brands', id }],
    }),
    createBrand: build.mutation<ApiSuccess<Brand>, CreateBrandRequest>({
      query: (body) => ({ url: '/admin/brands', method: 'POST', data: body }),
      invalidatesTags: ['Brands'],
    }),
    updateBrand: build.mutation<ApiSuccess<Brand>, { id: string } & UpdateBrandRequest>({
      query: ({ id, ...body }) => ({ url: `/admin/brands/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_res, _err, arg) => ['Brands', { type: 'Brands', id: arg.id }],
    }),
    setBrandStatus: build.mutation<ApiSuccess<Brand>, { id: string; status: BrandStatus; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/brands/${id}/status`, method: 'PATCH', data: body }),
      invalidatesTags: ['Brands'],
    }),
    mergeBrand: build.mutation<ApiSuccess<MergeBrandResponse>, { id: string; targetId: string; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/brands/${id}/merge`, method: 'POST', data: body }),
      invalidatesTags: ['Brands'],
    }),
    importBrands: build.mutation<ApiSuccess<BrandImportPreview | BrandImportCommit>, { mode: 'validate' | 'commit'; rows: BrandImportRow[] }>({
      query: (body) => ({ url: '/admin/brands/import', method: 'POST', data: body }),
      invalidatesTags: (_res, _err, arg) => (arg.mode === 'commit' ? ['Brands'] : []),
    }),
    exportBrands: build.query<ApiSuccess<Record<string, unknown>[]>, void>({
      query: () => ({ url: '/admin/brands/export', method: 'GET' }),
    }),
    brandRequests: build.query<ApiPaginated<AdminBrandRequestItem>, { page?: number; limit?: number; status?: ApprovalState }>({
      query: (args) => ({
        url: '/admin/brands/requests',
        method: 'GET',
        params: { page: args.page ?? 1, limit: args.limit ?? 20, status: args.status ?? 'PENDING' },
      }),
      providesTags: ['BrandRequests'],
    }),
    reviewBrandRequest: build.mutation<ApiSuccess<AdminBrandRequestItem>, { id: string } & ReviewBrandRequest>({
      query: ({ id, ...body }) => ({ url: `/admin/brands/requests/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['BrandRequests', 'Brands'],
    }),
    brandAuthorisations: build.query<ApiPaginated<AdminAuthQueueItem>, { page?: number; limit?: number; status?: ApprovalState }>({
      query: (args) => ({
        url: '/admin/brands/authorisations',
        method: 'GET',
        params: { page: args.page ?? 1, limit: args.limit ?? 20, status: args.status ?? 'PENDING' },
      }),
      providesTags: ['BrandAccess'],
    }),
    reviewBrandAuthorisation: build.mutation<ApiSuccess<AdminAuthQueueItem>, { id: string } & ReviewBrandAuthorisation>({
      query: ({ id, ...body }) => ({ url: `/admin/brands/authorisations/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['BrandAccess'],
    }),
  }),
});

export const {
  useListBrandsQuery,
  useBrandDetailQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useSetBrandStatusMutation,
  useMergeBrandMutation,
  useImportBrandsMutation,
  useExportBrandsQuery,
  useBrandRequestsQuery,
  useReviewBrandRequestMutation,
  useBrandAuthorisationsQuery,
  useReviewBrandAuthorisationMutation,
} = brandsApi;
