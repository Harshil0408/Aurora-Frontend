import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { apiClient } from '@/lib/axios';

export interface AxiosBaseQueryArgs {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: unknown;
  // `action` on GET /admin/activity is repeatable (&action=a&action=b) —
  // axios serializes arrays; undefined values are dropped.
  params?: Record<string, string | number | boolean | string[] | undefined>;
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
