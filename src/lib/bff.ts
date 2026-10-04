/**
 * BFF proxy URL helpers (pure — unit-tested).
 * Used by `src/app/api/[...path]/route.ts` to map
 * `/api/v1/<...rest>` → `<backend>/api/v1/<...rest>`.
 */

/** Normalise any backend env shape to `…/api/v1` (no trailing slash). */
export function normalizeBackendBase(raw: string | undefined | null): string {
  const trimmed = (raw ?? 'http://localhost:4000/api/v1').replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
}

/**
 * Build the upstream target for proxy path segments.
 * Returns null when the path is not under `v1/` (not proxied — 404).
 */
export function buildProxyTarget(
  segments: string[],
  search: string,
  backendBase: string,
): string | null {
  if (segments[0] !== 'v1') return null;
  const rest = segments.slice(1).map(encodeURIComponent).join('/');
  return `${backendBase}/${rest}${search}`;
}
