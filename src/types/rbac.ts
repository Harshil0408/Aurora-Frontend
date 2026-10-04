/**
 * RBAC domain types — mirror of backend contracts
 * (backend: /api/v1/admin/{roles,permissions}/ *).
 *
 * Conventions: role keys are permanent slugs (snake_case, never renamable);
 * permission keys are permanent `module.action` pairs — only
 * labels/descriptions change. Statuses are UPPERCASE on the wire.
 */

export type RoleStatus = 'ACTIVE' | 'INACTIVE';
export type PermissionStatus = 'ACTIVE' | 'INACTIVE';

export interface Role {
  /** Slug, permanent — display as-is, never an editable field. */
  key: string;
  name: string;
  description: string | null;
  /** System roles can't be deleted (API forbids). */
  isSystem: boolean;
  /** INACTIVE roles grant nothing. */
  status: RoleStatus;
  /** Sorted effective keys (ACTIVE grants only). */
  permissions: string[];
  permissionCount: number;
  /** Delete allowed only when 0. */
  assignedAdmins: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionItem {
  key: string;
  module: string;
  action: string;
  label: string;
  description: string | null;
  status: PermissionStatus;
  isSystem: boolean;
}

export interface PermGroup {
  group: string;
  label: string;
  permissions: PermissionItem[];
}

export interface Permission extends PermissionItem {
  /** Delete allowed only when 0. */
  roleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyPermissions {
  permissions: string[];
}

export interface CreateRoleRequest {
  key: string;
  name: string;
  description?: string;
  permissionKeys?: string[];
}

export interface CloneRoleRequest {
  key: string;
  name: string;
  description?: string;
}

export interface UpdateRoleMetaRequest {
  name?: string;
  description?: string;
}

export interface RoleStatusRequest {
  status: RoleStatus;
  reason: string;
}

/**
 * Result of POST (grant) / DELETE (revoke) /admin/roles/:key/permissions.
 * Both are idempotent: already-granted keys land in `alreadyGranted` on
 * POST, keys the role doesn't hold land there on DELETE. Refresh UI from
 * `permissions` (or `role`) — `added`/`removed` only describe the delta.
 */
export interface ModifyResult {
  added: string[];
  alreadyGranted: string[];
  removed: string[];
  /** Resulting full set — use this to refresh UI. */
  permissions: string[];
  /** Resulting role — use this to refresh UI. */
  role: Role;
}

/**
 * `details` shapes surfaced by RBAC 400/403 errors. The machine code lives in
 * `details.code` (e.g. `CANNOT_GRANT_UNHELD_PERMISSION`, `PERMISSION_INACTIVE`);
 * the envelope `error.code` only carries the HTTP enum (`FORBIDDEN`, …).
 */
export interface RbacErrorDetails {
  code?: string;
  unheld?: string[];
}
