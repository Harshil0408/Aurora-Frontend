import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type {
  ApprovalState,
  ApplySellerAuthorisation,
  BrandAccessState,
  CreateSellerBrandRequest,
  SellerAuthorisation,
  SellerBrandRequest,
  SellerBrandRow,
} from '@/types/brands';

/** Seller face of the brand master (backend: `/api/v1/seller/catalog/:storeId/brands*`). */
export const sellerBrandsApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerBrands: build.query<
      ApiSuccess<SellerBrandRow[]>,
      { storeId: string; search?: string; openOnly?: boolean }
    >({
      query: ({ storeId, search, openOnly }) => ({
        url: `/seller/catalog/${storeId}/brands`,
        method: 'GET',
        params: { search, openOnly },
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerBrands', id: storeId }],
    }),
    sellerBrandRequests: build.query<ApiSuccess<SellerBrandRequest[]>, { storeId: string; status?: ApprovalState }>({
      query: ({ storeId, status }) => ({
        url: `/seller/catalog/${storeId}/brands/requests`,
        method: 'GET',
        params: { status },
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerBrands', id: `${storeId}:requests` }],
    }),
    sellerRequestBrand: build.mutation<ApiSuccess<SellerBrandRequest>, { storeId: string } & CreateSellerBrandRequest>({
      query: ({ storeId, ...body }) => ({
        url: `/seller/catalog/${storeId}/brands/requests`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerBrands', id: `${storeId}:requests` }],
    }),
    sellerBrandAuthorisations: build.query<ApiSuccess<SellerAuthorisation[]>, { storeId: string; status?: ApprovalState }>({
      query: ({ storeId, status }) => ({
        url: `/seller/catalog/${storeId}/brands/authorisations`,
        method: 'GET',
        params: { status },
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerBrands', id: `${storeId}:authorisations` }],
    }),
    sellerApplyBrandAuth: build.mutation<
      ApiSuccess<{ brandId: string; access: BrandAccessState }>,
      { storeId: string; brandId: string } & ApplySellerAuthorisation
    >({
      query: ({ storeId, brandId, ...body }) => ({
        url: `/seller/catalog/${storeId}/brands/${brandId}/authorisations`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerBrands', id: storeId },
        { type: 'SellerBrands', id: `${storeId}:authorisations` },
      ],
    }),
  }),
});

export const {
  useSellerBrandsQuery,
  useSellerBrandRequestsQuery,
  useSellerRequestBrandMutation,
  useSellerBrandAuthorisationsQuery,
  useSellerApplyBrandAuthMutation,
} = sellerBrandsApi;
