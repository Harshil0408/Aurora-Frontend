/**
 * Auth domain types — mirror of backend contracts
 * (backend: POST /api/v1/admin/auth/*, source of truth src/docs/openapi.ts).
 * 2FA is optional: login branches on requires2fa. channel is totp|email_otp,
 * TOTP wins when both are on.
 */

/** 2FA channel — TOTP takes precedence when both methods enabled. */
export type TwoFactorChannel = 'totp' | 'email_otp';

/** POST /admin/auth/login — branching response */
export interface LoginRequest {
  email: string;
  password: string;
}
export type LoginResponse =
  | {
      requires2fa: false;
      accessToken: string;
      expiresInSeconds: number;
    }
  | {
      requires2fa: true;
      channel: TwoFactorChannel;
      pendingToken: string;
      expiresInSeconds: number;
    };

/** POST /admin/auth/me — profile for topbar, badges, gating, Security page */
export interface MeResponse {
  id: string;
  email: string;
  status: string;
  twoFactor: { totpEnabled: boolean; emailOtpEnabled: boolean };
  roles: string[];
  permissions: string[];
  createdAt: string;
}

/** POST /admin/auth/2fa/enroll (legacy pending-token re-enrollment) */
export interface TwoFactorEnrollRequest {
  pendingToken: string;
}
export interface TwoFactorEnrollResponse {
  otpauthUrl: string;
  qrDataUrl: string;
  recoveryCodes: string[];
}

/** POST /admin/auth/2fa/totp/enroll (Security page, Bearer, empty body) */
export interface TotpEnrollResponse {
  otpauthUrl: string;
  qrDataUrl: string;
  recoveryCodes: string[];
}

/** POST /admin/auth/2fa/totp/confirm (Bearer) + legacy /2fa/confirm (pendingToken) */
export interface TwoFactorConfirmRequest {
  pendingToken: string;
  code: string;
}
export interface TotpConfirmRequest {
  code: string;
}
export interface TwoFactorConfirmResponse {
  enrolled: boolean;
}

/** POST /admin/auth/2fa/verify — code is TOTP | recovery | emailed OTP */
export interface TwoFactorVerifyRequest {
  pendingToken: string;
  code: string;
}
export type TwoFactorMethod = 'totp' | 'recovery' | 'email_otp';
export interface TwoFactorVerifyResponse {
  accessToken: string;
  expiresInSeconds: number;
  method: TwoFactorMethod;
}

/** Email OTP family (Security page + login resend) */
export interface EmailOtpSentResponse {
  sent: boolean;
}
export interface EmailOtpConfirmRequest {
  code: string;
}
export interface EmailOtpConfirmResponse {
  enrolled: boolean;
}
export interface EmailOtpResendRequest {
  pendingToken: string;
}
export interface EmailOtpDisableRequest {
  password: string;
  code: string;
}
export interface EmailOtpDisableResponse {
  disabled: boolean;
}

/** POST /admin/auth/refresh — no body, cookie-driven */
export interface RefreshResponse {
  accessToken: string;
  expiresInSeconds: number;
}

/** POST /admin/auth/logout + /logout-all */
export interface LogoutResponse {
  loggedOut: boolean;
}

/** GET /admin/auth/sessions */
export interface AuthSession {
  id: string;
  familyId: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
  current: boolean;
}
export interface RevokeSessionResponse {
  revoked: boolean;
}

/** POST /admin/auth/forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}
export interface ForgotPasswordResponse {
  message: string;
}

/** POST /admin/auth/reset-password */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
export interface ResetPasswordResponse {
  reset: boolean;
}

/** POST /admin/auth/change-password */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
export interface ChangePasswordResponse {
  changed: boolean;
}

/** POST /admin/auth/2fa/disable (TOTP) — kills all sessions */
export interface DisableTwoFactorRequest {
  password: string;
  code: string;
}
export interface DisableTwoFactorResponse {
  disabled: boolean;
}

/** Decoded access-token claims (informational; never trust client-side). */
export interface AccessTokenClaims {
  sub: string;
  sid: string;
  tv: number;
  perms: string[];
}

/** Auth flow stage for the login wizard. */
export type AuthStage =
  | 'password'
  | 'verify'
  | 'enroll'
  | 'confirm-enroll'
  | 'done';
