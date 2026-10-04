/**
 * Backend URL is server-only input for the BFF proxy
 * (`src/app/api/[...path]/route.ts`). The browser never calls it directly —
 * all client traffic goes same-origin through `apiProxyBase` below.
 */
export const config = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
  /** Same-origin BFF prefix — `apiClient` baseURL. Keeps cookies + avoids CORS. */
  apiProxyBase: '/api/v1',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Aurora Admin',
  accessTokenExpirySeconds: 300,
} as const;
