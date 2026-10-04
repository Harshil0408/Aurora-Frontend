import {
  canVisitRoute,
  hasSessionCookie,
  isPublicRoute,
  requiredPermsForRoute,
} from '@/lib/permissions';

describe('route permissions', () => {
  it('maps module pages to their view permission', () => {
    expect(requiredPermsForRoute('/admins')).toEqual(['admin.read']);
    expect(requiredPermsForRoute('/admins/some-id')).toEqual(['admin.read']);
    expect(requiredPermsForRoute('/roles')).toEqual(['role.read']);
    expect(requiredPermsForRoute('/activity')).toEqual(['audit.read']);
    expect(requiredPermsForRoute('/sessions')).toEqual(['session.read']);
  });

  it('leaves personal pages open to any authenticated admin', () => {
    expect(requiredPermsForRoute('/dashboard')).toEqual([]);
    expect(requiredPermsForRoute('/security')).toEqual([]);
    expect(requiredPermsForRoute('/themes')).toEqual([]);
  });

  it('grants only when a required key is held', () => {
    expect(canVisitRoute(new Set(['admin.read']), '/admins')).toBe(true);
    expect(canVisitRoute(new Set(['role.read']), '/admins')).toBe(false);
    expect(canVisitRoute([], '/admins')).toBe(false);
    expect(canVisitRoute([], '/dashboard')).toBe(true);
    // 403-emptied set denies every gated route
    expect(canVisitRoute(new Set(), '/roles')).toBe(false);
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
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/login/verify')).toBe(true);
    expect(isPublicRoute('/forgot-password')).toBe(true);
    expect(isPublicRoute('/reset-password/abc')).toBe(true);
    expect(isPublicRoute('/dashboard')).toBe(false);
    expect(isPublicRoute('/admins')).toBe(false);
  });
});
