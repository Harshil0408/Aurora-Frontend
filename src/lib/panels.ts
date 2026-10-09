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

/** URL prefix of the seller console. */
export const SELLER_PREFIX = '/seller';

/** Seller sign-in / sign-up pages. Unauthenticated visits land here with `?next=`. */
export const SELLER_LOGIN_PATH = `${SELLER_PREFIX}/login`;
export const SELLER_REGISTER_PATH = `${SELLER_PREFIX}/register`;

/** Seller onboarding (no stores yet) and invitation landing. */
export const SELLER_CREATE_STORE_PATH = `${SELLER_PREFIX}/onboarding/create-store`;
export const SELLER_INVITE_ACCEPT_PATH = `${SELLER_PREFIX}/invite/accept`;

/** Invitee inbox — pending invites for the logged-in email (Accept / Decline). */
export const SELLER_INVITATIONS_PATH = `${SELLER_PREFIX}/invitations`;

/** Seller landing page after sign-in (when stores exist, store dashboard). */
export const SELLER_HOME_PATH = `${SELLER_PREFIX}/stores`;

/** Store-scoped seller paths. `storeId` is the stable store ID (never the slug). */
export function sellerStorePath(storeId: string, suffix = 'dashboard'): string {
  return `${SELLER_PREFIX}/stores/${storeId}/${suffix}`;
}

export function sellerDashboardPath(storeId: string): string {
  return sellerStorePath(storeId, 'dashboard');
}

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
