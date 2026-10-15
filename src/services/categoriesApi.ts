import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  ApprovalStatus,
  CategoryNode,
  CategoryRequestRow,
  CategoryAccessRow,
  CreateCategoryRequest,
  ImportPreview,
  ListCategoriesArgs,
  UpdateCategoryRequest,
} from '@/types/categories';

/** Admin product-category tree (backend: `/api/v1/admin/categories*`). */
export const categoriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    categoryTree: build.query<ApiSuccess<CategoryNode[]>, void>({
      query: () => ({ url: '/admin/categories/tree', method: 'GET' }),
      providesTags: ['Categories'],
    }),
    listCategories: build.query<ApiPaginated<CategoryNode>, ListCategoriesArgs>({
      query: (args) => ({
        url: '/admin/categories',
        method: 'GET',
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          search: args.search,
          status: args.status,
          parentId: args.parentId,
          rootOnly: args.rootOnly,
          includeDeleted: args.includeDeleted,
        },
      }),
      providesTags: ['Categories'],
    }),
    categoryDetail: build.query<ApiSuccess<CategoryNode>, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: 'GET' }),
      providesTags: (_res, _err, id) => [{ type: 'Categories', id }],
    }),
    createCategory: build.mutation<ApiSuccess<CategoryNode>, CreateCategoryRequest>({
      query: (body) => ({ url: '/admin/categories', method: 'POST', data: body }),
      invalidatesTags: ['Categories'],
    }),
    updateCategory: build.mutation<ApiSuccess<CategoryNode>, { id: string } & UpdateCategoryRequest>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_res, _err, arg) => ['Categories', { type: 'Categories', id: arg.id }],
    }),
    setCategoryStatus: build.mutation<ApiSuccess<CategoryNode>, { id: string; status: 'ACTIVE' | 'INACTIVE'; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}/status`, method: 'PATCH', data: body }),
      invalidatesTags: ['Categories'],
    }),
    deleteCategory: build.mutation<ApiSuccess<{ id: string }>, { id: string; reason: string; reassignTo?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/${id}`, method: 'DELETE', data: body }),
      invalidatesTags: ['Categories'],
    }),
    importCategories: build.mutation<ApiSuccess<ImportPreview>, { mode: 'validate' | 'commit'; rows: Record<string, unknown>[] }>({
      query: (body) => ({ url: '/admin/categories/import', method: 'POST', data: body }),
      invalidatesTags: (_res, _err, arg) => (arg.mode === 'commit' ? ['Categories'] : []),
    }),
    exportCategories: build.query<ApiSuccess<Record<string, unknown>[]>, void>({
      query: () => ({ url: '/admin/categories/export', method: 'GET' }),
    }),
    categoryRequests: build.query<ApiPaginated<CategoryRequestRow>, { page?: number; limit?: number; status?: ApprovalStatus }>({
      query: (args) => ({
        url: '/admin/categories/requests',
        method: 'GET',
        params: { page: args.page ?? 1, limit: args.limit ?? 20, status: args.status ?? 'PENDING' },
      }),
      providesTags: ['CategoryRequests'],
    }),
    reviewCategoryRequest: build.mutation<ApiSuccess<CategoryRequestRow>, { id: string; decision: ApprovalStatus; reviewNote?: string; resolvedCategoryId?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/requests/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['CategoryRequests', 'Categories'],
    }),
    categoryAccessQueue: build.query<ApiPaginated<CategoryAccessRow>, { page?: number; limit?: number; status?: ApprovalStatus }>({
      query: (args) => ({
        url: '/admin/categories/access',
        method: 'GET',
        params: { page: args.page ?? 1, limit: args.limit ?? 20, status: args.status ?? 'PENDING' },
      }),
      providesTags: ['CategoryAccess'],
    }),
    reviewCategoryAccess: build.mutation<ApiSuccess<CategoryAccessRow>, { id: string; decision: ApprovalStatus; reviewNote?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/categories/access/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: ['CategoryAccess'],
    }),
  }),
});

export const {
  useCategoryTreeQuery,
  useListCategoriesQuery,
  useCategoryDetailQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useSetCategoryStatusMutation,
  useDeleteCategoryMutation,
  useImportCategoriesMutation,
  useExportCategoriesQuery,
  useCategoryRequestsQuery,
  useReviewCategoryRequestMutation,
  useCategoryAccessQueueQuery,
  useReviewCategoryAccessMutation,
} = categoriesApi;
