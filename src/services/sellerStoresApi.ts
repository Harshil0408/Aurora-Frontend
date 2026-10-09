import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type {
  CreateStoreRequest,
  SellerStoreDetail,
  SellerStoreSummary,
  SwitchStoreResponse,
} from '@/types/seller';

/** Seller stores — workspace model (backend: `/api/v1/seller/stores*`). */
export const sellerStoresApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerStores: build.query<ApiSuccess<SellerStoreSummary[]>, void>({
      query: () => ({ url: '/seller/stores', method: 'GET' }),
      providesTags: ['SellerStores'],
    }),
    sellerSwitchStore: build.mutation<ApiSuccess<SwitchStoreResponse>, { storeId: string }>({
      query: (body) => ({ url: '/seller/stores/switch', method: 'POST', data: body }),
      invalidatesTags: ['SellerStore'],
    }),
    sellerCreateStore: build.mutation<ApiSuccess<SellerStoreDetail>, CreateStoreRequest>({
      query: (body) => ({ url: '/seller/stores', method: 'POST', data: body }),
      invalidatesTags: ['SellerStores', 'SellerMe'],
    }),
    sellerStoreDetail: build.query<ApiSuccess<SellerStoreDetail>, string>({
      query: (storeId) => ({ url: `/seller/stores/${storeId}`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerStore', id: storeId }],
    }),
    sellerUpdateStore: build.mutation<
      ApiSuccess<SellerStoreDetail>,
      { storeId: string; body: Partial<CreateStoreRequest> }
    >({
      query: ({ storeId, body }) => ({ url: `/seller/stores/${storeId}`, method: 'PATCH', data: body }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerStore', id: storeId },
        'SellerStores',
      ],
    }),
    sellerCompleteOnboarding: build.mutation<
      ApiSuccess<{ storeId: string; onboardingCompletedAt: string }>,
      string
    >({
      query: (storeId) => ({ url: `/seller/stores/${storeId}/complete-onboarding`, method: 'POST', data: {} }),
      invalidatesTags: (_res, _err, storeId) => [
        { type: 'SellerStore', id: storeId },
        'SellerStores',
      ],
    }),
  }),
});

export const {
  useSellerStoresQuery,
  useSellerSwitchStoreMutation,
  useSellerCreateStoreMutation,
  useSellerStoreDetailQuery,
  useSellerUpdateStoreMutation,
  useSellerCompleteOnboardingMutation,
} = sellerStoresApi;
