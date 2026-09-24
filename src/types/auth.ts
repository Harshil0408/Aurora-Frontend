/**
 * Auth domain types — exact mirror of backend Zod schemas + response shapes
 * (backend: src/modules/auth/validation/auth.schemas.ts, routes/auth.routes.ts).
 * Assumption: backend base path is /api/v1/admin/auth per API plan §8.
 */

/** POST /admin/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  requires2fa: boolean;
  pendingToken: string;
  expiresInSeconds: number;
}

/** POST /admin/auth/2fa/enroll */
export interface TwoFactorEnrollRequest {
  pendingToken: string;
}
export interface TwoFactorEnrollResponse {
  otpauthUrl: string;
  qrDataUrl: string;
  recoveryCodes: string[];
}

/** POST /admin/auth/2fa/confirm */
export interface TwoFactorConfirmRequest {
  pendingToken: string;
  code: string;
}
export interface TwoFactorConfirmResponse {
  enrolled: boolean;
}

/** POST /admin/auth/2fa/verify */
export interface TwoFactorVerifyRequest {
  pendingToken: string;
  code: string;
}
export type TwoFactorMethod = 'totp' | 'recovery';
export interface TwoFactorVerifyResponse {
  accessToken: string;
  expiresInSeconds: number;
  method: TwoFactorMethod;
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

/** POST /admin/auth/2fa/disable */
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
