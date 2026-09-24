/**
 * Axios security contract:
 * - withCredentials + timeout + JSON defaults
 * - Authorization injected only when a token exists
 * - x-request-id on every request (traceability)
 * - 401 triggers exactly ONE refresh retry, skipped for public auth calls
 */
import axios from 'axios';
import { apiClient } from '@/lib/axios';
import { tokenManager } from '@/lib/tokenManager';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      post: jest.fn(),
    },
    post: jest.fn(),
  };
});

const mockedAxiosPost = axios.post as jest.Mock;

type Adapter = (config: unknown) => Promise<unknown>;

function setAdapter(fn: Adapter) {
  // @ts-expect-error — swap low-level adapter to stay offline
  apiClient.defaults.adapter = fn;
}

function okResponse(config: Record<string, unknown>, data: unknown = { ok: true }) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

function httpError(status: number, config: Record<string, unknown>) {
  const err = new Error(`Request failed with status ${status}`) as Error & {
    config: unknown;
    response: { status: number; data: unknown };
    isAxiosError: boolean;
  };
  err.config = config;
  err.response = { status, data: { success: false } };
  err.isAxiosError = true;
  return err;
}

describe('apiClient interceptors', () => {
  beforeEach(() => {
    tokenManager.clear();
    mockedAxiosPost.mockReset();
  });

  it('has secure defaults', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
    expect(apiClient.defaults.timeout).toBe(15_000);
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(String(apiClient.defaults.baseURL)).toContain('/api/v1');
  });

  it('injects Authorization + x-request-id when token exists', async () => {
    tokenManager.setToken('tok-123', 300);
    let seen: Record<string, unknown> = {};
    setAdapter(async (config: unknown) => {
      const c = config as { headers: { get: (k: string) => string } };
      seen = {
        auth: c.headers.get('Authorization'),
        rid: c.headers.get('x-request-id'),
      };
      return okResponse(config as Record<string, unknown>);
    });
    await apiClient.get('/protected');
    expect(seen.auth).toBe('Bearer tok-123');
    expect(typeof seen.rid).toBe('string');
  });

  it('omits Authorization when no token (no empty-bearer leak)', async () => {
    let seen: unknown = 'unset';
    setAdapter(async (config: unknown) => {
      const c = config as { headers: { get: (k: string) => string | null } };
      seen = c.headers.get('Authorization');
      return okResponse(config as Record<string, unknown>);
    });
    await apiClient.get('/public');
    expect(seen).toBeFalsy();
  });

  it('retries once after refresh on 401 for protected calls', async () => {
    tokenManager.setToken('stale', 300);
    mockedAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'fresh', expiresInSeconds: 300 } },
    });
    let calls = 0;
    let retriedAuth: unknown = null;
    setAdapter(async (config: unknown) => {
      calls += 1;
      const c = config as {
        url?: string;
        headers: { get: (k: string) => string | null };
      };
      if (calls === 1) throw httpError(401, config as Record<string, unknown>);
      retriedAuth = c.headers.get('Authorization');
      return okResponse(config as Record<string, unknown>, { retried: true });
    });
    const res = await apiClient.get('/protected');
    expect((res.data as { retried: boolean }).retried).toBe(true);
    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(retriedAuth).toBe('Bearer fresh');
  });

  it('never refreshes for public auth calls (no loop / no leak)', async () => {
    setAdapter(async (config: unknown) => {
      throw httpError(401, config as Record<string, unknown>);
    });
    await expect(apiClient.post('/admin/auth/login', {})).rejects.toThrow();
    await expect(
      apiClient.post('/admin/auth/refresh', {}),
    ).rejects.toThrow();
    expect(mockedAxiosPost).not.toHaveBeenCalled();
    expect(tokenManager.getToken()).toBeNull();
  });

  it('does not retry twice (prevents infinite 401 loop)', async () => {
    tokenManager.setToken('stale', 300);
    mockedAxiosPost.mockResolvedValueOnce({
      data: { data: { accessToken: 'fresh', expiresInSeconds: 300 } },
    });
    setAdapter(async (config: unknown) => {
      throw httpError(401, config as Record<string, unknown>);
    });
    await expect(apiClient.get('/protected')).rejects.toThrow();
    // 1 refresh + 2 attempts total, then give up
    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
  });
});
