/**
 * Central RBAC route map — single source of truth for page-level access.
 *
 * Page rule: a viewer may render a route only when they hold at least one of
 * the route's `anyOf` keys. Empty `anyOf` means "any authenticated admin".
 * Missing access renders the Next.js 404 (via `notFound()`), never a 403
 * panel and never a redirect — unheld modules must look non-existent.
 *
 * Frontend checks are UX only; the backend re-authorizes every request.
 */

/** Permission keys used for page gating (subset of backend catalog). */
export const PAGE_PERMS = {
  ADMIN_READ: 'admin.read',
  ADMIN_CREATE: 'admin.create',
  ADMIN_UPDATE: 'admin.update',
  ADMIN_SUSPEND: 'admin.suspend',
  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_ASSIGN: 'role.assign',
  AUDIT_READ: 'audit.read',
  SESSION_READ: 'session.read',
  SESSION_REVOKE: 'session.revoke',
} as const;

import {
  ADMIN_FORGOT_PASSWORD_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_RESET_PASSWORD_PATH,
} from '@/lib/panels';

/** Route prefix → permissions that unlock it. First match wins. */
export const ROUTE_PERMISSIONS: Array<{ prefix: string; anyOf: string[] }> = [
  { prefix: '/admin/admins', anyOf: [PAGE_PERMS.ADMIN_READ] },
  { prefix: '/admin/roles', anyOf: [PAGE_PERMS.ROLE_READ] },
  { prefix: '/admin/activity', anyOf: [PAGE_PERMS.AUDIT_READ] },
  { prefix: '/admin/sessions', anyOf: [PAGE_PERMS.SESSION_READ] },
  // /admin/dashboard, /admin/security, /admin/themes: any authenticated
  // admin (own data / prefs).
];

/** Permissions required to visit `pathname` (empty = authenticated only). */
export function requiredPermsForRoute(pathname: string): string[] {
  const hit = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  return hit ? [...hit.anyOf] : [];
}

/** True when `held` satisfies the route rule for `pathname`. */
export function canVisitRoute(held: Set<string> | string[], pathname: string): boolean {
  const required = requiredPermsForRoute(pathname);
  if (required.length === 0) return true;
  const set = Array.isArray(held) ? new Set(held) : held;
  return required.some((k) => set.has(k));
}

/** Name of the cookie that marks "this browser has a session". */
export const SESSION_HINT_COOKIE = 'ecomm-admin-has-session';

/** Cookie names that prove a backend session exists (refresh / session). */
const SESSION_COOKIE_HINTS = ['refresh', 'session', SESSION_HINT_COOKIE];

/** True when the request cookies contain any session evidence. */
export function hasSessionCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  const names = cookieHeader
    .split(';')
    .map((p) => p.trim().split('=')[0]?.trim().toLowerCase())
    .filter(Boolean);
  return names.some((n) => SESSION_COOKIE_HINTS.some((h) => n.includes(h)));
}

/** Public (unauthenticated) route prefixes — mirrored in middleware + AuthGuard. */
export const PUBLIC_PREFIXES = [ADMIN_LOGIN_PATH, ADMIN_FORGOT_PASSWORD_PATH, ADMIN_RESET_PASSWORD_PATH];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
