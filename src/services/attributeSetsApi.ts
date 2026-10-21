import { api } from "@/services/api";
import type { ApiPaginated, ApiSuccess } from "@/types/api";
import type {
  AttachItemRequest,
  CloneAttributeSetRequest,
  CreateAttributeSetRequest,
  CreateGroupRequest,
  ProductAttributeSet,
  ProductAttributeSetDetail,
  ProductAttributeStatus,
  ReorderRequest,
  UpdateAttributeSetRequest,
  UpdateGroupRequest,
  UpdateItemRequest,
} from "@/types/productAttributes";

/** Admin attribute sets (backend: `/api/v1/admin/attribute-sets*`). */
export const attributeSetsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAttributeSets: build.query<
      ApiPaginated<ProductAttributeSet>,
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: ProductAttributeStatus;
      }
    >({
      query: (args) => ({
        url: "/admin/attribute-sets",
        method: "GET",
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          search: args.search,
          status: args.status,
        },
      }),
      providesTags: ["AttributeSets"],
    }),
    attributeSetDetail: build.query<
      ApiSuccess<ProductAttributeSetDetail>,
      string
    >({
      query: (id) => ({ url: `/admin/attribute-sets/${id}`, method: "GET" }),
      providesTags: (_res, _err, id) => [{ type: "AttributeSets", id }],
    }),
    createAttributeSet: build.mutation<
      ApiSuccess<ProductAttributeSet>,
      CreateAttributeSetRequest
    >({
      query: (body) => ({
        url: "/admin/attribute-sets",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["AttributeSets"],
    }),
    updateAttributeSet: build.mutation<
      ApiSuccess<ProductAttributeSet>,
      { id: string } & UpdateAttributeSetRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/attribute-sets/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "AttributeSets",
        { type: "AttributeSets", id: arg.id },
      ],
    }),
    setAttributeSetStatus: build.mutation<
      ApiSuccess<ProductAttributeSet>,
      { id: string; status: ProductAttributeStatus; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/attribute-sets/${id}/status`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["AttributeSets"],
    }),
    deleteAttributeSet: build.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/attribute-sets/${id}`, method: "DELETE" }),
      invalidatesTags: ["AttributeSets"],
    }),
    cloneAttributeSet: build.mutation<
      ApiSuccess<ProductAttributeSet>,
      { id: string } & CloneAttributeSetRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/attribute-sets/${id}/clone`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["AttributeSets"],
    }),
    createAttributeSetGroup: build.mutation<
      ApiSuccess<ProductAttributeSetDetail["groups"][number]>,
      { setId: string } & CreateGroupRequest
    >({
      query: ({ setId, ...body }) => ({
        url: `/admin/attribute-sets/${setId}/groups`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
    updateAttributeSetGroup: build.mutation<
      ApiSuccess<ProductAttributeSetDetail["groups"][number]>,
      { setId: string; groupId: string } & UpdateGroupRequest
    >({
      query: ({ setId, groupId, ...body }) => ({
        url: `/admin/attribute-sets/${setId}/groups/${groupId}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
    deleteAttributeSetGroup: build.mutation<
      ApiSuccess<{ id: string }>,
      { setId: string; groupId: string }
    >({
      query: ({ setId, groupId }) => ({
        url: `/admin/attribute-sets/${setId}/groups/${groupId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
    attachAttributeSetItem: build.mutation<
      ApiSuccess<ProductAttributeSetDetail["items"][number]>,
      { setId: string } & AttachItemRequest
    >({
      query: ({ setId, ...body }) => ({
        url: `/admin/attribute-sets/${setId}/items`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
    updateAttributeSetItem: build.mutation<
      ApiSuccess<ProductAttributeSetDetail["items"][number]>,
      { setId: string; itemId: string } & UpdateItemRequest
    >({
      query: ({ setId, itemId, ...body }) => ({
        url: `/admin/attribute-sets/${setId}/items/${itemId}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
    reorderAttributeSetItems: build.mutation<
      ApiSuccess<{ setId: string; reordered: number }>,
      { setId: string } & ReorderRequest
    >({
      query: ({ setId, ...body }) => ({
        url: `/admin/attribute-sets/${setId}/items/reorder`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
    detachAttributeSetItem: build.mutation<
      ApiSuccess<{ id: string }>,
      { setId: string; itemId: string }
    >({
      query: ({ setId, itemId }) => ({
        url: `/admin/attribute-sets/${setId}/items/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "AttributeSets", id: arg.setId },
      ],
    }),
  }),
});

export const {
  useListAttributeSetsQuery,
  useAttributeSetDetailQuery,
  useCreateAttributeSetMutation,
  useUpdateAttributeSetMutation,
  useSetAttributeSetStatusMutation,
  useDeleteAttributeSetMutation,
  useCloneAttributeSetMutation,
  useCreateAttributeSetGroupMutation,
  useUpdateAttributeSetGroupMutation,
  useDeleteAttributeSetGroupMutation,
  useAttachAttributeSetItemMutation,
  useUpdateAttributeSetItemMutation,
  useReorderAttributeSetItemsMutation,
  useDetachAttributeSetItemMutation,
} = attributeSetsApi;
