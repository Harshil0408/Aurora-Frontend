import { api } from "@/services/api";
import type { ApiPaginated, ApiSuccess } from "@/types/api";
import type {
  CreateProductAttributeOption,
  CreateProductAttributeRequest,
  OptionSuggestionItem,
  ProductAttribute,
  ProductAttributeDetail,
  ProductAttributeOption,
  ProductAttributeStatus,
  ProductAttributeType,
  ReorderRequest,
  ReviewSuggestionRequest,
  UpdateProductAttributeOptionRequest,
  UpdateProductAttributeRequest,
} from "@/types/productAttributes";

/** Admin product-attribute catalog (backend: `/api/v1/admin/catalog-attributes*`). */
export const catalogAttributesApi = api.injectEndpoints({
  endpoints: (build) => ({
    listProductAttributes: build.query<
      ApiPaginated<ProductAttribute>,
      {
        page?: number;
        limit?: number;
        search?: string;
        type?: ProductAttributeType;
        status?: ProductAttributeStatus;
        includeDeleted?: boolean;
      }
    >({
      query: (args) => ({
        url: "/admin/catalog-attributes",
        method: "GET",
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          search: args.search,
          type: args.type,
          status: args.status,
        },
      }),
      providesTags: ["ProductAttributes"],
    }),
    productAttributeDetail: build.query<
      ApiSuccess<ProductAttributeDetail>,
      string
    >({
      query: (id) => ({
        url: `/admin/catalog-attributes/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "ProductAttributes", id }],
    }),
    createProductAttribute: build.mutation<
      ApiSuccess<ProductAttributeDetail>,
      CreateProductAttributeRequest
    >({
      query: (body) => ({
        url: "/admin/catalog-attributes",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["ProductAttributes", "OptionSuggestions"],
    }),
    updateProductAttribute: build.mutation<
      ApiSuccess<ProductAttribute>,
      { id: string } & UpdateProductAttributeRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/catalog-attributes/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "ProductAttributes",
        { type: "ProductAttributes", id: arg.id },
      ],
    }),
    setProductAttributeStatus: build.mutation<
      ApiSuccess<ProductAttribute>,
      { id: string; status: ProductAttributeStatus; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/catalog-attributes/${id}/status`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["ProductAttributes"],
    }),
    deleteProductAttribute: build.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({
        url: `/admin/catalog-attributes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProductAttributes", "AttributeSets"],
    }),
    addProductAttributeOption: build.mutation<
      ApiSuccess<ProductAttributeOption>,
      { attributeId: string } & CreateProductAttributeOption
    >({
      query: ({ attributeId, ...body }) => ({
        url: `/admin/catalog-attributes/${attributeId}/options`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "ProductAttributes",
        { type: "ProductAttributes", id: arg.attributeId },
      ],
    }),
    updateProductAttributeOption: build.mutation<
      ApiSuccess<ProductAttributeOption>,
      {
        attributeId: string;
        optionId: string;
      } & UpdateProductAttributeOptionRequest
    >({
      query: ({ attributeId, optionId, ...body }) => ({
        url: `/admin/catalog-attributes/${attributeId}/options/${optionId}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "ProductAttributes",
        { type: "ProductAttributes", id: arg.attributeId },
      ],
    }),
    reorderProductAttributeOptions: build.mutation<
      ApiSuccess<{ attributeId: string; reordered: number }>,
      { attributeId: string } & ReorderRequest
    >({
      query: ({ attributeId, ...body }) => ({
        url: `/admin/catalog-attributes/${attributeId}/options/reorder`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "ProductAttributes",
        { type: "ProductAttributes", id: arg.attributeId },
      ],
    }),
    deleteProductAttributeOption: build.mutation<
      ApiSuccess<{ id: string }>,
      { attributeId: string; optionId: string }
    >({
      query: ({ attributeId, optionId }) => ({
        url: `/admin/catalog-attributes/${attributeId}/options/${optionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, arg) => [
        "ProductAttributes",
        { type: "ProductAttributes", id: arg.attributeId },
      ],
    }),
    optionSuggestions: build.query<
      ApiPaginated<OptionSuggestionItem>,
      { page?: number; limit?: number; attributeId?: string }
    >({
      query: (args) => ({
        url: "/admin/catalog-attributes/suggestions",
        method: "GET",
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          attributeId: args.attributeId,
        },
      }),
      providesTags: ["OptionSuggestions"],
    }),
    reviewOptionSuggestion: build.mutation<
      ApiSuccess<ProductAttributeOption | { id: string; outcome: string }>,
      { optionId: string } & ReviewSuggestionRequest
    >({
      query: ({ optionId, ...body }) => ({
        url: `/admin/catalog-attributes/options/${optionId}/review`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["OptionSuggestions", "ProductAttributes"],
    }),
  }),
});

export const {
  useListProductAttributesQuery,
  useProductAttributeDetailQuery,
  useCreateProductAttributeMutation,
  useUpdateProductAttributeMutation,
  useSetProductAttributeStatusMutation,
  useDeleteProductAttributeMutation,
  useAddProductAttributeOptionMutation,
  useUpdateProductAttributeOptionMutation,
  useReorderProductAttributeOptionsMutation,
  useDeleteProductAttributeOptionMutation,
  useOptionSuggestionsQuery,
  useReviewOptionSuggestionMutation,
} = catalogAttributesApi;
