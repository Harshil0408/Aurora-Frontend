import {
  canVisitRoute,
  hasSessionCookie,
  isPublicRoute,
  requiredPermsForRoute,
} from '@/lib/permissions';

describe('route permissions', () => {
  it('maps module pages to their view permission', () => {
    expect(requiredPermsForRoute('/admin/admins')).toEqual(['admin.read']);
    expect(requiredPermsForRoute('/admin/admins/some-id')).toEqual(['admin.read']);
    expect(requiredPermsForRoute('/admin/roles')).toEqual(['role.read']);
    expect(requiredPermsForRoute('/admin/activity')).toEqual(['audit.read']);
    expect(requiredPermsForRoute('/admin/sessions')).toEqual(['session.read']);
  });

  it('leaves personal pages open to any authenticated admin', () => {
    expect(requiredPermsForRoute('/admin/dashboard')).toEqual([]);
    expect(requiredPermsForRoute('/admin/security')).toEqual([]);
    expect(requiredPermsForRoute('/admin/themes')).toEqual([]);
  });

  it('grants only when a required key is held', () => {
    expect(canVisitRoute(new Set(['admin.read']), '/admin/admins')).toBe(true);
    expect(canVisitRoute(new Set(['role.read']), '/admin/admins')).toBe(false);
    expect(canVisitRoute([], '/admin/admins')).toBe(false);
    expect(canVisitRoute([], '/admin/dashboard')).toBe(true);
    // 403-emptied set denies every gated route
    expect(canVisitRoute(new Set(), '/admin/roles')).toBe(false);
  });
});

describe('session cookie detection (middleware)', () => {
  it('detects the hint cookie and backend refresh/session cookies', () => {
    expect(hasSessionCookie('ecomm-admin-has-session=1')).toBe(true);
    expect(hasSessionCookie('admin_refresh_token=abc; Path=/')).toBe(true);
    expect(hasSessionCookie('sid_session=xyz')).toBe(true);
  });

  it('rejects missing or unrelated cookies', () => {
    expect(hasSessionCookie(null)).toBe(false);
    expect(hasSessionCookie(undefined)).toBe(false);
    expect(hasSessionCookie('')).toBe(false);
    expect(hasSessionCookie('theme=aurora; Path=/')).toBe(false);
  });
});

describe('public routes', () => {
  it('matches exact prefixes and subpaths only', () => {
    expect(isPublicRoute('/admin/login')).toBe(true);
    expect(isPublicRoute('/admin/login/verify')).toBe(true);
    expect(isPublicRoute('/admin/forgot-password')).toBe(true);
    expect(isPublicRoute('/admin/reset-password/abc')).toBe(true);
    expect(isPublicRoute('/admin/dashboard')).toBe(false);
    expect(isPublicRoute('/admin/admins')).toBe(false);
    // Legacy pre-panel paths are redirected by middleware, not public.
    expect(isPublicRoute('/login')).toBe(false);
    expect(isPublicRoute('/dashboard')).toBe(false);
  });
});
