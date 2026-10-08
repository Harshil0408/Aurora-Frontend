/**
 * Panel route map — one URL prefix per audience.
 *
 * - Admin console (live today): everything under `/admin`.
 * - Seller console (planned): `/seller`.
 * - Shopper account (planned): root `/*`.
 *
 * Page code must build panel URLs from these constants (never inline
 * `/admin/...` literals for cross-page navigation) so future panels plug
 * into the same helpers. Pure string logic — safe for edge middleware.
 */

/** URL prefix of the admin console. */
export const ADMIN_PREFIX = '/admin';

/** Admin sign-in page. Unauthenticated visits land here with `?next=`. */
export const ADMIN_LOGIN_PATH = `${ADMIN_PREFIX}/login`;

/** Admin landing page after sign-in. */
export const ADMIN_HOME_PATH = `${ADMIN_PREFIX}/dashboard`;

/** Admin password-recovery pages. */
export const ADMIN_FORGOT_PASSWORD_PATH = `${ADMIN_PREFIX}/forgot-password`;
export const ADMIN_RESET_PASSWORD_PATH = `${ADMIN_PREFIX}/reset-password`;

/**
 * Legacy (pre-panel) page paths → their `/admin/*` replacements.
 * Used to keep old bookmarks and in-flight `?next=` values working.
 * Order matters only for readability — matching is exact-or-subpath.
 */
export const LEGACY_ADMIN_PATHS: Record<string, string> = {
  '/login': ADMIN_LOGIN_PATH,
  '/forgot-password': ADMIN_FORGOT_PASSWORD_PATH,
  '/reset-password': ADMIN_RESET_PASSWORD_PATH,
  '/dashboard': ADMIN_HOME_PATH,
  '/admins': `${ADMIN_PREFIX}/admins`,
  '/roles': `${ADMIN_PREFIX}/roles`,
  '/activity': `${ADMIN_PREFIX}/activity`,
  '/sessions': `${ADMIN_PREFIX}/sessions`,
  '/security': `${ADMIN_PREFIX}/security`,
  '/themes': `${ADMIN_PREFIX}/themes`,
};

/**
 * Rewrite a legacy page path (including subpaths, e.g. `/roles/support`
 * → `/admin/roles/support`) to its `/admin/*` form. Unknown paths pass
 * through untouched.
 */
export function toAdminPath(pathname: string): string {
  for (const [legacy, replacement] of Object.entries(LEGACY_ADMIN_PATHS)) {
    if (pathname === legacy || pathname.startsWith(`${legacy}/`)) {
      return `${replacement}${pathname.slice(legacy.length)}`;
    }
  }
  return pathname;
}
