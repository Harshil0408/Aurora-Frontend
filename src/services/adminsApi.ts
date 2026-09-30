import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  AdminDetail,
  AdminListItem,
  AdminRoleOption,
  AdminsCounts,
  AdminsSummary,
  AdminStatus,
  CreateAdminRequest,
  CreateAdminResponse,
  ListAdminsArgs,
  UpdateRolesResponse,
} from '@/types/admins';

export interface ListAdminsResponse extends ApiPaginated<AdminListItem> {
  meta?: { counts: AdminsCounts; twoFactorEnabled: number };
}

export const adminsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAdmins: build.query<ListAdminsResponse, ListAdminsArgs>({
      // NOTE: axiosBaseQuery forwards `params` (query string) and `data`
      // (request body) — there is no `body` field.
      query: (args) => ({
        url: '/admin/admins',
        method: 'GET',
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 10,
          status: args.status,
          role: args.role,
          search: args.search,
        },
      }),
      providesTags: (res) =>
        res
          ? [...res.data.map((a) => ({ type: 'Admins' as const, id: a.id })), 'Admins']
          : ['Admins'],
    }),
    adminSummary: build.query<ApiSuccess<AdminsSummary>, void>({
      query: () => ({ url: '/admin/admins/summary', method: 'GET' }),
      providesTags: ['AdminSummary'],
    }),
    adminDetail: build.query<ApiSuccess<AdminDetail>, string>({
      query: (id) => ({ url: `/admin/admins/${id}`, method: 'GET' }),
      providesTags: (_res, _err, id) => [{ type: 'AdminDetail', id }],
    }),
    listRoles: build.query<ApiSuccess<AdminRoleOption[]>, void>({
      query: () => ({ url: '/admin/roles', method: 'GET' }),
      providesTags: ['Roles'],
    }),
    checkEmail: build.query<ApiSuccess<{ available: boolean }>, string>({
      query: (email) => ({
        url: '/admin/admins/check-email',
        method: 'GET',
        params: { email },
      }),
    }),
    generatePassword: build.mutation<ApiSuccess<{ password: string }>, void>({
      query: () => ({ url: '/admin/admins/password/generate', method: 'POST', data: {} }),
    }),
    createAdmin: build.mutation<ApiSuccess<CreateAdminResponse>, CreateAdminRequest>({
      query: (body) => ({ url: '/admin/admins', method: 'POST', data: body }),
      invalidatesTags: ['Admins', 'AdminSummary'],
    }),
    updateStatus: build.mutation<
      ApiSuccess<{ id: string; status: AdminStatus; updatedAt: string }>,
      { id: string; status: AdminStatus; reason: string }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/admins/${id}/status`, method: 'PATCH', data: body }),
      invalidatesTags: (_res, _err, arg) => [
        'Admins',
        'AdminSummary',
        { type: 'AdminDetail', id: arg.id },
      ],
    }),
    updateRoles: build.mutation<ApiSuccess<UpdateRolesResponse>, { id: string; roleKeys: string[] }>({
      query: ({ id, ...body }) => ({ url: `/admin/admins/${id}/roles`, method: 'PUT', data: body }),
      invalidatesTags: (_res, _err, arg) => [
        'Admins',
        'AdminSummary',
        { type: 'AdminDetail', id: arg.id },
        // Role changes can reshape the viewer's own permissions.
        'Me',
      ],
    }),
    revokeAdminSessions: build.mutation<ApiSuccess<{ revokedCount: number }>, string>({
      query: (id) => ({ url: `/admin/admins/${id}/revoke-sessions`, method: 'POST', data: {} }),
      invalidatesTags: (_res, _err, id) => [{ type: 'AdminDetail', id }],
    }),
  }),
});

export const {
  useListAdminsQuery,
  useAdminSummaryQuery,
  useAdminDetailQuery,
  useListRolesQuery,
  useLazyCheckEmailQuery,
  useGeneratePasswordMutation,
  useCreateAdminMutation,
  useUpdateStatusMutation,
  useUpdateRolesMutation,
  useRevokeAdminSessionsMutation,
} = adminsApi;
