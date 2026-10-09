import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type { SellerAuditRow, SellerPlan, SellerSubscription } from '@/types/seller';

/** Seller billing — trial-first SaaS (backend: `/api/v1/seller/billing*`). */
export const sellerBillingApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerPlans: build.query<ApiSuccess<SellerPlan[]>, void>({
      query: () => ({ url: '/seller/billing/plans', method: 'GET' }),
      providesTags: ['SellerPlans'],
    }),
    sellerSubscription: build.query<ApiSuccess<SellerSubscription | null>, string>({
      query: (storeId) => ({ url: `/seller/billing/${storeId}/subscription`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerSubscription', id: storeId }],
    }),
  }),
});

export const { useSellerPlansQuery, useSellerSubscriptionQuery } = sellerBillingApi;

/** Seller activity — store audit feed (backend: `/api/v1/seller/activity/*`). */
export const sellerActivityApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerAudit: build.query<
      ApiSuccess<SellerAuditRow[]> & { meta?: { total: number; page: number; limit: number } },
      { storeId: string; page?: number; limit?: number; action?: string }
    >({
      query: ({ storeId, page = 1, limit = 20, action }) => ({
        url: `/seller/activity/${storeId}/audit`,
        method: 'GET',
        params: { page, limit, action },
      }),
      providesTags: (_res, _err, { storeId }) => [{ type: 'SellerActivity', id: storeId }],
    }),
  }),
});

export const { useSellerAuditQuery } = sellerActivityApi;
