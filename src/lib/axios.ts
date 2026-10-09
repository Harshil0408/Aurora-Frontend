import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { config } from "@/lib/config";
import { tokenManager } from "@/lib/tokenManager";

export const apiClient = axios.create({
  // Same-origin BFF (`src/app/api/[...path]/route.ts`) — never the backend
  // origin directly. Keeps the refresh cookie first-party + avoids CORS.
  baseURL: config.apiProxyBase,
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((req) => {
  const token = tokenManager.getToken();
  if (token) {
    req.headers.set("Authorization", `Bearer ${token}`);
  }
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    req.headers.set("x-request-id", crypto.randomUUID());
  }
  return req;
});

const refreshPromises: Partial<Record<'admin' | 'seller', Promise<string | null> | null>> = {};

async function performRefresh(namespace: 'admin' | 'seller'): Promise<string | null> {
  const res = await axios.post<{
    success: true;
    data: { accessToken: string; expiresInSeconds: number };
  }>(
    `${config.apiProxyBase}/${namespace}/auth/refresh`,
    {},
    { withCredentials: true, timeout: 15_000 },
  );
  const { accessToken, expiresInSeconds } = res.data.data;
  tokenManager.setToken(accessToken, expiresInSeconds);
  return accessToken;
}

interface RetryableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = (error.config ?? {}) as RetryableConfig;
    const status = error.response?.status;
    const url = original.url ?? "";

    const isPublicAuthCall =
      url.includes('/admin/auth/login') ||
      url.includes('/admin/auth/2fa/') ||
      url.includes('/admin/auth/forgot-password') ||
      url.includes('/admin/auth/reset-password') ||
      url.includes('/admin/auth/refresh') ||
      url.includes('/seller/auth/login') ||
      url.includes('/seller/auth/register') ||
      url.includes('/seller/auth/refresh');

    if (status === 401 && !original._retried && !isPublicAuthCall) {
      original._retried = true;
      // The seller refresh cookie (`seller_rt`) only rotates via the seller
      // namespace — refreshing through `/admin/auth/refresh` would revoke
      // nothing and loop. Route the rotation by request namespace.
      const namespace = url.includes('/seller/') ? 'seller' : 'admin';
      try {
        if (!refreshPromises[namespace]) {
          refreshPromises[namespace] = performRefresh(namespace).finally(() => {
            refreshPromises[namespace] = null;
          });
        }
        const fresh = await refreshPromises[namespace];
        if (fresh) {
          original.headers = {
            ...(original.headers ?? {}),
            Authorization: `Bearer ${fresh}`,
          };
          return apiClient.request(original);
        }
      } catch {
        tokenManager.clear();
      }
    }
    return Promise.reject(error);
  },
);
