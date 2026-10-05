import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  ActionOption,
  ActivityActionsArgs,
  ActivityEntry,
  ListActivityArgs,
} from '@/types/activity';

/**
 * Activity-log endpoints (backend: /api/v1/admin/activity*).
 * The log is append-only — reads only, no mutations exist.
 * List is newest-first; `actions` excludes the `action` filter so its
 * counts describe the *other* active filters (dropdown + summary chips).
 */
export const activityApi = api.injectEndpoints({
  endpoints: (build) => ({
    listActivity: build.query<ApiPaginated<ActivityEntry>, ListActivityArgs | void>({
      query: (args) => ({
        url: '/admin/activity',
        method: 'GET',
        params: {
          page: args?.page ?? 1,
          limit: args?.limit ?? 20,
          action: args?.action,
          q: args?.q,
          actor: args?.actor,
          from: args?.from,
          to: args?.to,
          sort: args?.sort,
        },
      }),
      providesTags: (res) =>
        res
          ? [...res.data.map((e) => ({ type: 'Activity' as const, id: e.id })), 'Activity']
          : ['Activity'],
    }),
    activityActions: build.query<ApiSuccess<ActionOption[]>, ActivityActionsArgs | void>({
      query: (args) => ({
        url: '/admin/activity/actions',
        method: 'GET',
        params: {
          q: args?.q,
          actor: args?.actor,
          from: args?.from,
          to: args?.to,
        },
      }),
      providesTags: ['Activity'],
    }),
    activityDetail: build.query<ApiSuccess<ActivityEntry>, string>({
      query: (id) => ({ url: `/admin/activity/${id}`, method: 'GET' }),
      providesTags: (_res, _err, id) => [{ type: 'Activity', id }],
    }),
  }),
});

export const { useListActivityQuery, useActivityActionsQuery, useActivityDetailQuery } =
  activityApi;
