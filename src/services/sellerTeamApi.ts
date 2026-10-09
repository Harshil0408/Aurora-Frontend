import { api } from '@/services/api';
import type { ApiSuccess } from '@/types/api';
import type {
  CreateInvitationResponse,
  PendingInvitation,
  SellerInvitation,
  SellerMember,
  SellerPermissionGroup,
  SellerRole,
} from '@/types/seller';

/** Seller team & roles — store-scoped RBAC (backend: `/api/v1/seller/team/*`). */
export const sellerTeamApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerMembers: build.query<ApiSuccess<SellerMember[]>, string>({
      query: (storeId) => ({ url: `/seller/team/${storeId}/members`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerMembers', id: storeId }],
    }),
    sellerUpdateMemberRole: build.mutation<
      ApiSuccess<SellerMember>,
      { storeId: string; userId: string; roleKey: string }
    >({
      query: ({ storeId, userId, roleKey }) => ({
        url: `/seller/team/${storeId}/members/${userId}/role`,
        method: 'PATCH',
        data: { roleKey },
      }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerMembers', id: storeId },
        { type: 'SellerStore', id: storeId },
      ],
    }),
    sellerRemoveMember: build.mutation<ApiSuccess<{ removed: boolean }>, { storeId: string; userId: string }>({
      query: ({ storeId, userId }) => ({
        url: `/seller/team/${storeId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { storeId }) => [
        { type: 'SellerMembers', id: storeId },
        { type: 'SellerStore', id: storeId },
      ],
    }),
    sellerInvitations: build.query<ApiSuccess<SellerInvitation[]>, string>({
      query: (storeId) => ({ url: `/seller/team/${storeId}/invitations`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerInvitations', id: storeId }],
    }),
    sellerInviteMember: build.mutation<
      ApiSuccess<CreateInvitationResponse>,
      { storeId: string; email: string; roleKey: string }
    >({
      query: ({ storeId, email, roleKey }) => ({
        url: `/seller/team/${storeId}/invitations`,
        method: 'POST',
        data: { email, roleKey },
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerInvitations', id: storeId }],
    }),
    sellerRevokeInvitation: build.mutation<
      ApiSuccess<{ revoked: boolean }>,
      { storeId: string; invitationId: string }
    >({
      query: ({ storeId, invitationId }) => ({
        url: `/seller/team/${storeId}/invitations/${invitationId}/revoke`,
        method: 'POST',
        data: {},
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerInvitations', id: storeId }],
    }),
    sellerAcceptInvitation: build.mutation<
      ApiSuccess<{ storeId: string; membershipId: string }>,
      // Invite-link flow sends the one-time `token`. The inbox has no token
      // (only the hash is stored server-side), so inbox accepts send the
      // invitation id instead — the backend resolves it for the logged-in email.
      { token?: string; invitationId?: string }
    >({
      query: (body) => ({ url: '/seller/team/invitations/accept', method: 'POST', data: body }),
      invalidatesTags: ['SellerMe', 'SellerStores', 'SellerInvitations'],
    }),
    /**
     * Invitee inbox — pending invites matched by logged-in email, for joiners
     * who arrive without the link (fresh login, lost email).
     */
    sellerPendingInvitations: build.query<ApiSuccess<PendingInvitation[]>, void>({
      query: () => ({ url: '/seller/team/invitations/pending', method: 'GET' }),
      providesTags: ['SellerInvitations'],
    }),
    /**
     * Invitee declines their own pending invite. Terminal for that id — the
     * owner must send a fresh invite to re-invite. Already-handled ids 400.
     */
    sellerDeclineInvitation: build.mutation<ApiSuccess<{ declined: boolean }>, string>({
      query: (invitationId) => ({
        url: `/seller/team/invitations/${invitationId}/decline`,
        method: 'POST',
        data: {},
      }),
      invalidatesTags: ['SellerInvitations'],
    }),
    sellerRoles: build.query<ApiSuccess<SellerRole[]>, string>({
      query: (storeId) => ({ url: `/seller/team/${storeId}/roles`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerRoles', id: storeId }],
    }),
    sellerCreateRole: build.mutation<
      ApiSuccess<SellerRole>,
      { storeId: string; key: string; name: string; description?: string; permissionKeys?: string[] }
    >({
      query: ({ storeId, ...body }) => ({ url: `/seller/team/${storeId}/roles`, method: 'POST', data: body }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerRoles', id: storeId }],
    }),
    sellerUpdateRole: build.mutation<
      ApiSuccess<SellerRole>,
      { storeId: string; roleKey: string; name?: string; description?: string }
    >({
      query: ({ storeId, roleKey, ...body }) => ({
        url: `/seller/team/${storeId}/roles/${roleKey}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerRoles', id: storeId }],
    }),
    sellerUpdateRolePermissions: build.mutation<
      ApiSuccess<SellerRole>,
      { storeId: string; roleKey: string; permissionKeys: string[] }
    >({
      query: ({ storeId, roleKey, permissionKeys }) => ({
        url: `/seller/team/${storeId}/roles/${roleKey}/permissions`,
        method: 'PUT',
        data: { permissionKeys },
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerRoles', id: storeId }],
    }),
    sellerDeleteRole: build.mutation<ApiSuccess<{ deleted: boolean }>, { storeId: string; roleKey: string }>({
      query: ({ storeId, roleKey }) => ({
        url: `/seller/team/${storeId}/roles/${roleKey}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { storeId }) => [{ type: 'SellerRoles', id: storeId }],
    }),
    sellerPermissionCatalog: build.query<ApiSuccess<SellerPermissionGroup[]>, string>({
      query: (storeId) => ({ url: `/seller/team/${storeId}/permissions`, method: 'GET' }),
      providesTags: (_res, _err, storeId) => [{ type: 'SellerPermissions', id: storeId }],
    }),
  }),
});

export const {
  useSellerMembersQuery,
  useSellerUpdateMemberRoleMutation,
  useSellerRemoveMemberMutation,
  useSellerInvitationsQuery,
  useSellerInviteMemberMutation,
  useSellerRevokeInvitationMutation,
  useSellerAcceptInvitationMutation,
  useSellerPendingInvitationsQuery,
  useLazySellerPendingInvitationsQuery,
  useSellerDeclineInvitationMutation,
  useSellerRolesQuery,
  useSellerCreateRoleMutation,
  useSellerUpdateRoleMutation,
  useSellerUpdateRolePermissionsMutation,
  useSellerDeleteRoleMutation,
  useSellerPermissionCatalogQuery,
} = sellerTeamApi;
