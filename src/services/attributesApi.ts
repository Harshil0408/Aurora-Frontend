import { api } from '@/services/api';
import type { ApiPaginated, ApiSuccess } from '@/types/api';
import type {
  Attribute,
  AttributeTypeRow,
  CreateAttributeRequest,
  ListAttributesArgs,
  SetAttributeStatusRequest,
  UpdateAttributeRequest,
} from '@/types/attributes';

export const attributesApi = api.injectEndpoints({
  endpoints: (build) => ({
    attributeTypes: build.query<ApiSuccess<AttributeTypeRow[]>, void>({
      query: () => ({ url: '/admin/attributes/types', method: 'GET' }),
      providesTags: ['AttributeTypes'],
    }),
    listAttributes: build.query<ApiPaginated<Attribute>, ListAttributesArgs>({
      // NOTE: axiosBaseQuery forwards `params` (query string) and `data`
      // (request body) — there is no `body` field.
      query: (args) => ({
        url: '/admin/attributes',
        method: 'GET',
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          type: args.type,
          status: args.status,
          search: args.search,
        },
      }),
      providesTags: (res) =>
        res
          ? [
              ...res.data.map((a) => ({ type: 'Attributes' as const, id: a.id })),
              'Attributes',
            ]
          : ['Attributes'],
    }),
    attributeDetail: build.query<ApiSuccess<Attribute>, string>({
      query: (id) => ({ url: `/admin/attributes/${id}`, method: 'GET' }),
      providesTags: (_res, _err, id) => [{ type: 'AttributeDetail', id }],
    }),
    createAttribute: build.mutation<ApiSuccess<Attribute>, CreateAttributeRequest>({
      query: (body) => ({ url: '/admin/attributes', method: 'POST', data: body }),
      invalidatesTags: ['Attributes', 'AttributeTypes'],
    }),
    updateAttribute: build.mutation<
      ApiSuccess<Attribute>,
      { id: string } & UpdateAttributeRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/attributes/${id}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        'Attributes',
        'AttributeTypes',
        { type: 'AttributeDetail', id: arg.id },
      ],
    }),
    setAttributeStatus: build.mutation<
      ApiSuccess<Attribute>,
      { id: string } & SetAttributeStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/attributes/${id}/status`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        'Attributes',
        'AttributeTypes',
        { type: 'AttributeDetail', id: arg.id },
      ],
    }),
    deleteAttribute: build.mutation<ApiSuccess<{ deleted: true }>, string>({
      query: (id) => ({ url: `/admin/attributes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Attributes', 'AttributeTypes'],
    }),
  }),
});

export const {
  useAttributeTypesQuery,
  useListAttributesQuery,
  useLazyListAttributesQuery,
  useAttributeDetailQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useSetAttributeStatusMutation,
  useDeleteAttributeMutation,
} = attributesApi;

/** Error message when a row was already toggled to the requested status. */
export function isAlreadyStatusError(message: string | undefined): boolean {
  return message != null && /already (active|inactive)/i.test(message);
}

/** Machine message when a key is taken under the same type (409). */
export function isKeyConflict(status: number, message: string | undefined): boolean {
  return (
    status === 409 ||
    (message != null && /already in use for this type/i.test(message))
  );
}
