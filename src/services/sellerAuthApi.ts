import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type {
  SellerLoginRequest,
  SellerMeResponse,
  SellerRegisterRequest,
  SellerSession,
  SellerSessionPayload,
} from '@/types/seller';

/** Seller auth (backend: `/api/v1/seller/auth/*`). No 2FA — email+password only. */
export const sellerAuthApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerRegister: build.mutation<ApiSuccess<SellerSessionPayload>, SellerRegisterRequest>({
      query: (body) => ({ url: '/seller/auth/register', method: 'POST', data: body }),
    }),
    sellerLogin: build.mutation<ApiSuccess<SellerSessionPayload>, SellerLoginRequest>({
      query: (body) => ({ url: '/seller/auth/login', method: 'POST', data: body }),
    }),
    sellerMe: build.query<ApiSuccess<SellerMeResponse>, void>({
      query: () => ({ url: '/seller/auth/me', method: 'GET' }),
      providesTags: ['SellerMe', 'SellerStores'],
    }),
    sellerRefresh: build.mutation<ApiSuccess<{ accessToken: string; expiresInSeconds: number }>, void>({
      query: () => ({ url: '/seller/auth/refresh', method: 'POST', data: {} }),
    }),
    sellerLogout: build.mutation<ApiSuccess<{ loggedOut: boolean }>, void>({
      query: () => ({ url: '/seller/auth/logout', method: 'POST', data: {} }),
    }),
    sellerLogoutAll: build.mutation<ApiSuccess<{ loggedOut: boolean }>, void>({
      query: () => ({ url: '/seller/auth/logout-all', method: 'POST', data: {} }),
    }),
    sellerSessions: build.query<
      ApiSuccess<SellerSession[]> & { meta?: { total: number; page: number; limit: number } },
      { page?: number; limit?: number } | void
    >({
      query: (args) => ({
        url: '/seller/auth/sessions',
        method: 'GET',
        params: { page: args?.page ?? 1, limit: args?.limit ?? 20 },
      }),
      providesTags: ['SellerSessions'],
    }),
  }),
});

export const {
  useSellerRegisterMutation,
  useSellerLoginMutation,
  useSellerMeQuery,
  useLazySellerMeQuery,
  useSellerRefreshMutation,
  useSellerLogoutMutation,
  useSellerLogoutAllMutation,
  useSellerSessionsQuery,
} = sellerAuthApi;
