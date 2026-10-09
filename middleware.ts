import { NextRequest, NextResponse } from 'next/server';
import { hasSessionCookie, isPublicRoute, isSellerRoute } from '@/lib/permissions';
import {
  ADMIN_HOME_PATH,
  ADMIN_LOGIN_PATH,
  SELLER_HOME_PATH,
  SELLER_LOGIN_PATH,
  toAdminPath,
} from '@/lib/panels';

/**
 * Edge auth gate (UX-only — the backend re-authorizes every API call).
 *
 * - Admin auth pages (`/admin/login`, `/admin/forgot-password`,
 *   `/admin/reset-password`, …) always pass through.
 * - `/api/*`, `/_next/*` and static assets always pass through.
 * - `/` resolves to the admin home.
 * - Legacy pre-panel page paths (`/login`, `/dashboard`, `/roles`, …)
 *   redirect to their `/admin/*` replacements, preserving the query string
 *   (including a `?next=` value, which is translated the same way).
 * - No session cookie → protected page redirects to
 *   `/admin/login?next=<path>`.
 * - Session cookie + visiting `/admin/login` → redirect to `?next=` or
 *   `/admin/dashboard`.
 *
 * Permission checks (admin.read, role.read, …) cannot run here — the access
 * token lives in browser memory, invisible to the edge. Those run
 * client-side via `PageGuard` which renders the 404 for unheld modules.
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL(ADMIN_HOME_PATH, req.url));
  }

  const adminPath = toAdminPath(pathname);
  if (adminPath !== pathname) {
    const dest = new URL(adminPath, req.url);
    // The constructor carries the query string over; translate a legacy
    // `next` target as well so post-login redirects land on a live route.
    const next = req.nextUrl.searchParams.get('next');
    if (next != null) dest.searchParams.set('next', toAdminPath(next));
    return NextResponse.redirect(dest);
  }

  if (isPublicRoute(pathname)) {
    // Signed-in admins hitting /admin/login get bounced to their destination.
    if (pathname === ADMIN_LOGIN_PATH && hasSessionCookie(req.headers.get('cookie'))) {
      const rawNext = req.nextUrl.searchParams.get('next') || ADMIN_HOME_PATH;
      const next = toAdminPath(rawNext);
      const dest = next.startsWith('/') && !next.startsWith('//') ? next : ADMIN_HOME_PATH;
      return NextResponse.redirect(new URL(dest, req.url));
    }
    // Signed-in sellers hitting /seller/login continue to their destination.
    if (pathname === SELLER_LOGIN_PATH && hasSessionCookie(req.headers.get('cookie'))) {
      const rawNext = req.nextUrl.searchParams.get('next') || SELLER_HOME_PATH;
      const dest = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : SELLER_HOME_PATH;
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (hasSessionCookie(req.headers.get('cookie'))) return NextResponse.next();

  // Panel-aware login redirect (UX-only — the backend re-authorizes every API call).
  if (isSellerRoute(pathname)) {
    const login = new URL(SELLER_LOGIN_PATH, req.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const login = new URL(ADMIN_LOGIN_PATH, req.url);
  login.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)',
  ],
};
