import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  AuthSession,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DisableTwoFactorRequest,
  DisableTwoFactorResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  RevokeSessionResponse,
  TwoFactorConfirmRequest,
  TwoFactorConfirmResponse,
  TwoFactorEnrollRequest,
  TwoFactorEnrollResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
} from '@/types/auth';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiSuccess<LoginResponse>, LoginRequest>({
      query: (body) => ({ url: '/admin/auth/login', method: 'POST', data: body }),
    }),
    enroll2fa: build.mutation<ApiSuccess<TwoFactorEnrollResponse>, TwoFactorEnrollRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/enroll', method: 'POST', data: body }),
    }),
    confirm2fa: build.mutation<ApiSuccess<TwoFactorConfirmResponse>, TwoFactorConfirmRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/confirm', method: 'POST', data: body }),
    }),
    verify2fa: build.mutation<ApiSuccess<TwoFactorVerifyResponse>, TwoFactorVerifyRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/verify', method: 'POST', data: body }),
    }),
    refresh: build.mutation<ApiSuccess<RefreshResponse>, void>({
      query: () => ({ url: '/admin/auth/refresh', method: 'POST', data: {} }),
    }),
    logout: build.mutation<ApiSuccess<LogoutResponse>, void>({
      query: () => ({ url: '/admin/auth/logout', method: 'POST', data: {} }),
    }),
    logoutAll: build.mutation<ApiSuccess<LogoutResponse>, void>({
      query: () => ({ url: '/admin/auth/logout-all', method: 'POST', data: {} }),
    }),
    sessions: build.query<ApiPaginated<AuthSession>, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/admin/auth/sessions',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Sessions'],
    }),
    revokeSession: build.mutation<ApiSuccess<RevokeSessionResponse>, { id: string }>({
      query: ({ id }) => ({ url: `/admin/auth/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sessions'],
    }),
    forgotPassword: build.mutation<ApiSuccess<ForgotPasswordResponse>, ForgotPasswordRequest>({
      query: (body) => ({ url: '/admin/auth/forgot-password', method: 'POST', data: body }),
    }),
    resetPassword: build.mutation<ApiSuccess<ResetPasswordResponse>, ResetPasswordRequest>({
      query: (body) => ({ url: '/admin/auth/reset-password', method: 'POST', data: body }),
    }),
    changePassword: build.mutation<ApiSuccess<ChangePasswordResponse>, ChangePasswordRequest>({
      query: (body) => ({ url: '/admin/auth/change-password', method: 'POST', data: body }),
    }),
    disable2fa: build.mutation<ApiSuccess<DisableTwoFactorResponse>, DisableTwoFactorRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/disable', method: 'POST', data: body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useEnroll2faMutation,
  useConfirm2faMutation,
  useVerify2faMutation,
  useRefreshMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useSessionsQuery,
  useRevokeSessionMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useDisable2faMutation,
} = authApi;
