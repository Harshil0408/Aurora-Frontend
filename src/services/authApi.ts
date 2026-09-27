import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  AuthSession,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DisableTwoFactorRequest,
  DisableTwoFactorResponse,
  EmailOtpConfirmRequest,
  EmailOtpConfirmResponse,
  EmailOtpDisableRequest,
  EmailOtpDisableResponse,
  EmailOtpResendRequest,
  EmailOtpSentResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  RevokeSessionResponse,
  TotpConfirmRequest,
  TotpEnrollResponse,
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
    me: build.query<ApiSuccess<MeResponse>, void>({
      query: () => ({ url: '/admin/auth/me', method: 'GET' }),
      providesTags: ['Me'],
    }),
    // Legacy pending-token re-enrollment (login-time). Prefer totp/* on Security page.
    enroll2fa: build.mutation<ApiSuccess<TwoFactorEnrollResponse>, TwoFactorEnrollRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/enroll', method: 'POST', data: body }),
    }),
    confirm2fa: build.mutation<ApiSuccess<TwoFactorConfirmResponse>, TwoFactorConfirmRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/confirm', method: 'POST', data: body }),
    }),
    // Logged-in TOTP enable (Bearer, Security page).
    enrollTotp: build.mutation<ApiSuccess<TotpEnrollResponse>, void>({
      query: () => ({ url: '/admin/auth/2fa/totp/enroll', method: 'POST', data: {} }),
    }),
    confirmTotp: build.mutation<ApiSuccess<TwoFactorConfirmResponse>, TotpConfirmRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/totp/confirm', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),
    verify2fa: build.mutation<ApiSuccess<TwoFactorVerifyResponse>, TwoFactorVerifyRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/verify', method: 'POST', data: body }),
    }),
    // Email OTP family.
    requestEmailOtp: build.mutation<ApiSuccess<EmailOtpSentResponse>, void>({
      query: () => ({ url: '/admin/auth/2fa/email/request', method: 'POST', data: {} }),
    }),
    confirmEmailOtp: build.mutation<ApiSuccess<EmailOtpConfirmResponse>, EmailOtpConfirmRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/email/confirm', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),
    disableEmailOtp: build.mutation<ApiSuccess<EmailOtpDisableResponse>, EmailOtpDisableRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/email/disable', method: 'POST', data: body }),
      invalidatesTags: ['Me'],
    }),
    resendEmailOtp: build.mutation<ApiSuccess<EmailOtpSentResponse>, EmailOtpResendRequest>({
      query: (body) => ({ url: '/admin/auth/2fa/email/resend', method: 'POST', data: body }),
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
      invalidatesTags: ['Me'],
    }),
  }),
});

export const {
  useLoginMutation,
  useMeQuery,
  useEnroll2faMutation,
  useConfirm2faMutation,
  useEnrollTotpMutation,
  useConfirmTotpMutation,
  useVerify2faMutation,
  useRequestEmailOtpMutation,
  useConfirmEmailOtpMutation,
  useDisableEmailOtpMutation,
  useResendEmailOtpMutation,
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
