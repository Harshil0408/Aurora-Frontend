import { api } from "@/services/api";
import type { ApiSuccess } from "@/types/api";
import type {
  ProductAttributeOption,
  SellerResolvedAttributeSet,
  SuggestOptionRequest,
} from "@/types/productAttributes";

/** Seller face of the attribute system — product-form read + option suggestions (backend: `/api/v1/seller/catalog/:storeId/*`). */
export const sellerAttributesApi = api.injectEndpoints({
  endpoints: (build) => ({
    sellerCategoryAttributeSet: build.query<
      ApiSuccess<SellerResolvedAttributeSet>,
      { storeId: string; categoryId: string }
    >({
      query: ({ storeId, categoryId }) => ({
        url: `/seller/catalog/${storeId}/categories/${categoryId}/attribute-set`,
        method: "GET",
      }),
      providesTags: (_res, _err, arg) => [
        { type: "SellerAttributes", id: `${arg.storeId}:${arg.categoryId}` },
      ],
    }),
    sellerSuggestAttributeOption: build.mutation<
      ApiSuccess<ProductAttributeOption>,
      { storeId: string; attributeId: string } & SuggestOptionRequest
    >({
      query: ({ storeId, attributeId, ...body }) => ({
        url: `/seller/catalog/${storeId}/attributes/${attributeId}/options`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "SellerAttributes", id: arg.storeId },
      ],
    }),
  }),
});

export const {
  useSellerCategoryAttributeSetQuery,
  useSellerSuggestAttributeOptionMutation,
} = sellerAttributesApi;
