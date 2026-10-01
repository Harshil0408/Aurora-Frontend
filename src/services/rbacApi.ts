import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type {
  CloneRoleRequest,
  CreateRoleRequest,
  DefinePermissionRequest,
  MyPermissions,
  PermGroup,
  Permission,
  PermissionStatus,
  PermissionStatusRequest,
  Role,
  RoleStatusRequest,
  UpdatePermissionRequest,
  UpdateRoleMetaRequest,
} from '@/types/rbac';

/**
 * Roles + permissions endpoints (backend: /api/v1/admin/{roles,permissions}).
 * Every RBAC mutation invalidates `Me` — the viewer's own rights may have
 * changed, so `useMyPermissionsQuery` refetches automatically.
 */
export const rbacApi = api.injectEndpoints({
  endpoints: (build) => ({
    myPermissions: build.query<ApiSuccess<MyPermissions>, void>({
      query: () => ({ url: '/admin/permissions/me', method: 'GET' }),
      providesTags: ['Me'],
    }),
    listRoles: build.query<ApiSuccess<Role[]>, void>({
      query: () => ({ url: '/admin/roles', method: 'GET' }),
      providesTags: (res) =>
        res
          ? [...res.data.map((r) => ({ type: 'RoleDetail' as const, id: r.key })), 'Roles']
          : ['Roles'],
    }),
    roleDetail: build.query<ApiSuccess<Role>, string>({
      query: (key) => ({ url: `/admin/roles/${key}`, method: 'GET' }),
      providesTags: (_res, _err, key) => [{ type: 'RoleDetail', id: key }],
    }),
    createRole: build.mutation<ApiSuccess<Role>, CreateRoleRequest>({
      query: (body) => ({ url: '/admin/roles', method: 'POST', data: body }),
      invalidatesTags: ['Roles', 'Me'],
    }),
    cloneRole: build.mutation<ApiSuccess<Role>, { sourceKey: string; body: CloneRoleRequest }>({
      query: ({ sourceKey, body }) => ({
        url: `/admin/roles/${sourceKey}/clone`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Roles', 'Me'],
    }),
    updateRoleMeta: build.mutation<ApiSuccess<Role>, { key: string; body: UpdateRoleMetaRequest }>({
      query: ({ key, body }) => ({ url: `/admin/roles/${key}`, method: 'PATCH', data: body }),
      invalidatesTags: (_res, _err, arg) => [
        'Roles',
        { type: 'RoleDetail', id: arg.key },
        'Me',
      ],
    }),
    replaceRolePermissions: build.mutation<
      ApiSuccess<{ updated: boolean }>,
      { key: string; permissionKeys: string[] }
    >({
      // NOTE: axiosBaseQuery forwards `data` (request body) — no `body` field.
      query: ({ key, permissionKeys }) => ({
        url: `/admin/roles/${key}/permissions`,
        method: 'PUT',
        data: { permissionKeys },
      }),
      invalidatesTags: (_res, _err, arg) => [
        'Roles',
        { type: 'RoleDetail', id: arg.key },
        'Me',
      ],
    }),
    updateRoleStatus: build.mutation<ApiSuccess<Role>, { key: string; body: RoleStatusRequest }>({
      query: ({ key, body }) => ({ url: `/admin/roles/${key}/status`, method: 'PATCH', data: body }),
      invalidatesTags: (_res, _err, arg) => [
        'Roles',
        { type: 'RoleDetail', id: arg.key },
        'Me',
      ],
    }),
    deleteRole: build.mutation<ApiSuccess<{ deleted: boolean }>, string>({
      query: (key) => ({ url: `/admin/roles/${key}`, method: 'DELETE' }),
      invalidatesTags: ['Roles', 'Me'],
    }),
    permissionGroups: build.query<ApiSuccess<PermGroup[]>, void>({
      query: () => ({ url: '/admin/permissions', method: 'GET' }),
      providesTags: ['Permissions'],
    }),
    listPermissions: build.query<ApiSuccess<Permission[]>, PermissionStatus | undefined>({
      query: (status) => ({
        url: '/admin/permissions/list',
        method: 'GET',
        params: status ? { status } : undefined,
      }),
      providesTags: ['Permissions'],
    }),
    definePermission: build.mutation<ApiSuccess<Permission>, DefinePermissionRequest>({
      query: (body) => ({ url: '/admin/permissions', method: 'POST', data: body }),
      invalidatesTags: ['Permissions', 'Me'],
    }),
    updatePermission: build.mutation<
      ApiSuccess<Permission>,
      { key: string; body: UpdatePermissionRequest }
    >({
      query: ({ key, body }) => ({ url: `/admin/permissions/${key}`, method: 'PATCH', data: body }),
      invalidatesTags: ['Permissions', 'Me'],
    }),
    updatePermissionStatus: build.mutation<
      ApiSuccess<Permission>,
      { key: string; body: PermissionStatusRequest }
    >({
      query: ({ key, body }) => ({
        url: `/admin/permissions/${key}/status`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Permissions', 'Me'],
    }),
    deletePermission: build.mutation<ApiSuccess<{ deleted: boolean }>, string>({
      query: (key) => ({ url: `/admin/permissions/${key}`, method: 'DELETE' }),
      invalidatesTags: ['Permissions', 'Me'],
    }),
  }),
});

export const {
  useMyPermissionsQuery,
  useListRolesQuery,
  useRoleDetailQuery,
  useCreateRoleMutation,
  useCloneRoleMutation,
  useUpdateRoleMetaMutation,
  useReplaceRolePermissionsMutation,
  useUpdateRoleStatusMutation,
  useDeleteRoleMutation,
  usePermissionGroupsQuery,
  useListPermissionsQuery,
  useDefinePermissionMutation,
  useUpdatePermissionMutation,
  useUpdatePermissionStatusMutation,
  useDeletePermissionMutation,
} = rbacApi;
