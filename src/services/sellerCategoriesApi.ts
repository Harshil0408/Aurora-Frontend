import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type {
  ApprovalStatus,
  CategoryAccessRow,
  CategoryRequestRow,
  SellerCategoryNode,
} from '@/types/categories';

/** Seller face of the category tree (backend: `/api/v1/seller/catalog/:storeId/categories*`). */
export const sellerCategoriesApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerCategoryTree: build.query<ApiSuccess<SellerCategoryNode[]>, string>({
      query: (storeId) => ({ url: `/seller/catalog/${storeId}/categories/tree`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerCategories', id: storeId }],
    }),
    sellerCategoryRequests: build.query<ApiSuccess<CategoryRequestRow[]>, { storeId: string; status?: ApprovalStatus }>({
      query: ({ storeId, status }) => ({
        url: `/seller/catalog/${storeId}/categories/requests`,
        method: 'GET',
        params: { status },
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerCategories', id: `${storeId}:requests` }],
    }),
    sellerRequestCategory: build.mutation<ApiSuccess<CategoryRequestRow>, { storeId: string; name: string; justification: string; proposedParentId?: string | null }>({
      query: ({ storeId, ...body }) => ({
        url: `/seller/catalog/${storeId}/categories/requests`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerCategories', id: `${storeId}:requests` }],
    }),
    sellerCategoryAccess: build.query<ApiSuccess<CategoryAccessRow[]>, { storeId: string; status?: ApprovalStatus }>({
      query: ({ storeId, status }) => ({
        url: `/seller/catalog/${storeId}/categories/access`,
        method: 'GET',
        params: { status },
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerCategories', id: `${storeId}:access` }],
    }),
    sellerApplyCategoryAccess: build.mutation<ApiSuccess<CategoryAccessRow>, { storeId: string; categoryId: string; documentAssetIds: string[]; note?: string }>({
      query: ({ storeId, categoryId, ...body }) => ({
        url: `/seller/catalog/${storeId}/categories/${categoryId}/access`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerCategories', id: storeId },
        { type: 'SellerCategories', id: `${storeId}:access` },
      ],
    }),
  }),
});

export const {
  useSellerCategoryTreeQuery,
  useSellerCategoryRequestsQuery,
  useSellerRequestCategoryMutation,
  useSellerCategoryAccessQuery,
  useSellerApplyCategoryAccessMutation,
} = sellerCategoriesApi;
