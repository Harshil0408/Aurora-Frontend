import { NextRequest, NextResponse } from 'next/server';
import { hasSessionCookie, isPublicRoute } from '@/lib/permissions';

/**
 * Edge auth gate (UX-only — the backend re-authorizes every API call).
 *
 * - Public routes (`/login`, `/forgot-password`, `/reset-password`, …)
 *   always pass through.
 * - `/api/*`, `/_next/*` and static assets always pass through.
 * - No session cookie → protected page redirects to `/login?next=<path>`.
 * - Session cookie + visiting `/login` → redirect to `?next=` or `/dashboard`.
 *
 * Permission checks (admin.read, role.read, …) cannot run here — the access
 * token lives in browser memory, invisible to the edge. Those run
 * client-side via `PageGuard` which renders the 404 for unheld modules.
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname, search } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    // Signed-in admins hitting /login get bounced to their destination.
    if (pathname === '/login' && hasSessionCookie(req.headers.get('cookie'))) {
      const next = req.nextUrl.searchParams.get('next') || '/dashboard';
      const dest = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (hasSessionCookie(req.headers.get('cookie'))) return NextResponse.next();

  const login = new URL('/login', req.url);
  login.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)$).*)',
  ],
};
