import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { config } from "@/lib/config";
import { tokenManager } from "@/lib/tokenManager";

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
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

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const res = await axios.post<{
    success: true;
    data: { accessToken: string; expiresInSeconds: number };
  }>(
    `${config.apiBaseUrl}/admin/auth/refresh`,
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
      url.includes("/admin/auth/login") ||
      url.includes("/admin/auth/2fa/") ||
      url.includes("/admin/auth/forgot-password") ||
      url.includes("/admin/auth/reset-password") ||
      url.includes("/admin/auth/refresh");

    if (status === 401 && !original._retried && !isPublicAuthCall) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const fresh = await refreshPromise;
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
