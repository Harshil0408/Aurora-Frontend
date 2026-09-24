import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/axios';

/**
 * RTK Query base query backed by the shared axios instance so that
 * cookie handling, Bearer injection and single-flight refresh apply
 * uniformly to every endpoint (highest performance: one client, one policy).
 */
export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, { status: number; data: unknown }> =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await apiClient.request({
        url,
        method,
        data,
        params,
      });
      return { data: result.data };
    } catch (err) {
      const axiosError = err as AxiosError;
      return {
        error: {
          status: axiosError.response?.status ?? 500,
          data: axiosError.response?.data ?? { success: false },
        },
      };
    }
  };
