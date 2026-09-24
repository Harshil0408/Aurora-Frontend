let accessToken: string | null = null;
let accessTokenExpiresAt = 0;

export const tokenManager = {
  getToken(): string | null {
    return accessToken;
  },
  setToken(token: string | null, expiresInSeconds = 300): void {
    accessToken = token;
    accessTokenExpiresAt = token
      ? Date.now() + expiresInSeconds * 1000
      : 0;
  },
  clear(): void {
    accessToken = null;
    accessTokenExpiresAt = 0;
  },
  /** True when token is missing or will expire within `skewMs`. */
  isExpired(skewMs = 30_000): boolean {
    if (!accessToken) return true;
    return Date.now() >= accessTokenExpiresAt - skewMs;
  },
};
