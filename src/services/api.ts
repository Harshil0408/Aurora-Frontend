import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/services/baseQuery';

/**
 * Root RTK Query API. Feature APIs inject endpoints via `injectEndpoints`
 * so the store holds a single reducer + middleware (optimal bundle/code-split).
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Sessions'],
  endpoints: () => ({}),
});
