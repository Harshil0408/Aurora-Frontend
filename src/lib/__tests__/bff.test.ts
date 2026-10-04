import { buildProxyTarget, normalizeBackendBase } from '@/lib/bff';

describe('normalizeBackendBase', () => {
  it('keeps a full …/api/v1 base as-is (minus trailing slashes)', () => {
    expect(normalizeBackendBase('http://localhost:4000/api/v1')).toBe(
      'http://localhost:4000/api/v1',
    );
    expect(normalizeBackendBase('http://localhost:4000/api/v1///')).toBe(
      'http://localhost:4000/api/v1',
    );
  });

  it('expands …/api and bare origins to …/api/v1', () => {
    expect(normalizeBackendBase('http://localhost:4000/api')).toBe(
      'http://localhost:4000/api/v1',
    );
    expect(normalizeBackendBase('http://localhost:4000')).toBe(
      'http://localhost:4000/api/v1',
    );
  });

  it('falls back to the local backend when env is missing', () => {
    expect(normalizeBackendBase(undefined)).toBe('http://localhost:4000/api/v1');
  });
});

describe('buildProxyTarget', () => {
  const base = 'http://localhost:4000/api/v1';

  it('maps /api/v1/admin/auth/login without doubling v1', () => {
    expect(
      buildProxyTarget(['v1', 'admin', 'auth', 'login'], '', base),
    ).toBe('http://localhost:4000/api/v1/admin/auth/login');
  });

  it('preserves query strings and encodes segments', () => {
    expect(
      buildProxyTarget(['v1', 'admin', 'admins'], '?page=2&limit=10', base),
    ).toBe('http://localhost:4000/api/v1/admin/admins?page=2&limit=10');
    expect(buildProxyTarget(['v1', 'admin', 'a b'], '', base)).toBe(
      'http://localhost:4000/api/v1/admin/a%20b',
    );
  });

  it('rejects non-v1 paths (proxy 404s instead of open-relaying)', () => {
    expect(buildProxyTarget(['v2', 'admin'], '', base)).toBeNull();
    expect(buildProxyTarget([], '', base)).toBeNull();
  });
});
