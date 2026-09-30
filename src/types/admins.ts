/**
 * Admins domain types — mirror of backend contracts
 * (backend: /api/v1/admin/admins/*).
 *
 * Conventions: statuses are UPPERCASE on the wire (ACTIVE / SUSPENDED /
 * DISABLED) and formatted for display client-side. Role identity is the
 * `key` from GET /admin/roles (snake_case); `name` is display-only.
 */

export type AdminStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

/** Display labels for API statuses (wire format stays uppercase). */
export const ADMIN_STATUS_LABEL: Record<AdminStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DISABLED: 'Disabled',
};

export type AdminStatusTab = 'All' | AdminStatus;

export interface RoleRef {
  key: string;
  name: string;
}

export interface AdminRoleOption extends RoleRef {
  description?: string;
  system?: boolean;
}

export interface AdminListItem {
  id: string;
  email: string;
  name: string;
  status: AdminStatus;
  roles: RoleRef[];
  twoFactor: { enabled: boolean; methods: Array<'totp' | 'email_otp'> };
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  isSelf: boolean;
  isLastActiveSuperAdmin: boolean;
}

export interface AdminRecentActivity {
  id: string;
  action: string;
  actorEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminDetail extends AdminListItem {
  activeSessionsCount: number;
  recentActivity: AdminRecentActivity[];
}

export interface AdminsSummary {
  total: number;
  active: number;
  suspended: number;
  disabled: number;
  needsAttention: number;
  twoFactorEnabled: number;
}

export interface AdminsCounts {
  total: number;
  active: number;
  suspended: number;
  disabled: number;
}

export interface ListAdminsArgs {
  page?: number;
  limit?: number;
  /** Omit for the "All" tab. */
  status?: AdminStatus;
  /** Role key from GET /admin/roles. */
  role?: string;
  /** Sent only when ≥ 2 chars (caller debounces). */
  search?: string;
}

export interface CreateAdminRequest {
  email: string;
  name: string;
  tempPassword: string;
  roleKeys: string[];
}

export interface CreateAdminResponse {
  id: string;
  email: string;
  name: string;
  status: AdminStatus;
  roles: RoleRef[];
  inviteSent: boolean;
  createdAt: string;
}

export interface UpdateRolesResponse {
  roles: RoleRef[];
  added: string[];
  removed: string[];
}

/** Machine codes live in `error.details.code` (HTTP enum is `error.code`). */
export type AdminMachineCode =
  | 'EMAIL_IN_USE'
  | 'LAST_SUPER_ADMIN'
  | 'CANNOT_CHANGE_OWN_STATUS'
  | 'CANNOT_REMOVE_OWN_SUPER_ADMIN'
  | 'SUPER_ADMIN_GRANT_FORBIDDEN'
  | 'ADMIN_NOT_FOUND'
  | 'TOO_WEAK'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'UNKNOWN_ROLE'
  | 'ROLE_REQUIRED'
  | 'INVALID_STATUS'
  | 'INVALID_SORT';

/** Normalised role-key compare — tolerant of snake_case / display names. */
export function isSuperAdminKey(key: string): boolean {
  return key.toLowerCase().replace(/[^a-z]/g, '') === 'superadmin';
}
