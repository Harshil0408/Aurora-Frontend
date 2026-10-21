import { api } from "@/services/api";
import type { ApiPaginated, ApiSuccess } from "@/types/api";
import type {
  CommerceSettings,
  CreateHsnCodeRequest,
  CreateTaxClassRequest,
  CreateTaxRateRequest,
  CreateUnitRequest,
  HsnCode,
  HsnKind,
  QuoteTaxRequest,
  SetTaxClassStatusRequest,
  TaxClass,
  TaxClassDetail,
  TaxClassStatus,
  TaxQuoteResult,
  TaxRate,
  UnitDimension,
  UnitOfMeasure,
  UpdateCommerceSettingsRequest,
  UpdateHsnCodeRequest,
  UpdateTaxClassRequest,
  UpdateTaxRateRequest,
  UpdateUnitRequest,
} from "@/types/commerce";

/** Admin commerce (backend: `/api/v1/admin/tax*`, `/admin/hsn-codes*`, `/admin/units*`, `/admin/commerce-settings*`). */
export const commerceApi = api.injectEndpoints({
  endpoints: (build) => ({
    listTaxClasses: build.query<
      ApiPaginated<TaxClass>,
      {
        page?: number;
        limit?: number;
        status?: TaxClassStatus;
        search?: string;
      }
    >({
      query: (args) => ({
        url: "/admin/tax-classes",
        method: "GET",
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 100,
          status: args.status,
          search: args.search,
        },
      }),
      providesTags: ["TaxClasses"],
    }),
    taxClassDetail: build.query<ApiSuccess<TaxClassDetail>, string>({
      query: (id) => ({ url: `/admin/tax-classes/${id}`, method: "GET" }),
      providesTags: (_res, _err, id) => [{ type: "TaxClasses", id }],
    }),
    createTaxClass: build.mutation<ApiSuccess<TaxClass>, CreateTaxClassRequest>(
      {
        query: (body) => ({
          url: "/admin/tax-classes",
          method: "POST",
          data: body,
        }),
        invalidatesTags: ["TaxClasses"],
      },
    ),
    updateTaxClass: build.mutation<
      ApiSuccess<TaxClass>,
      { id: string } & UpdateTaxClassRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/tax-classes/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "TaxClasses",
        { type: "TaxClasses", id: arg.id },
      ],
    }),
    setTaxClassStatus: build.mutation<
      ApiSuccess<TaxClass>,
      { id: string } & SetTaxClassStatusRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/tax-classes/${id}/status`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["TaxClasses"],
    }),
    deleteTaxClass: build.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/tax-classes/${id}`, method: "DELETE" }),
      invalidatesTags: ["TaxClasses"],
    }),
    createTaxRate: build.mutation<
      ApiSuccess<TaxRate>,
      { id: string } & CreateTaxRateRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/tax-classes/${id}/rates`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "TaxClasses",
        { type: "TaxClasses", id: arg.id },
      ],
    }),
    updateTaxRate: build.mutation<
      ApiSuccess<TaxRate>,
      { id: string; rateId: string } & UpdateTaxRateRequest
    >({
      query: ({ id, rateId, ...body }) => ({
        url: `/admin/tax-classes/${id}/rates/${rateId}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        "TaxClasses",
        { type: "TaxClasses", id: arg.id },
      ],
    }),
    deleteTaxRate: build.mutation<
      ApiSuccess<{ id: string }>,
      { id: string; rateId: string }
    >({
      query: ({ id, rateId }) => ({
        url: `/admin/tax-classes/${id}/rates/${rateId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, arg) => [
        "TaxClasses",
        { type: "TaxClasses", id: arg.id },
      ],
    }),
    quoteTax: build.mutation<ApiSuccess<TaxQuoteResult>, QuoteTaxRequest>({
      query: (body) => ({
        url: "/admin/tax/quote",
        method: "POST",
        data: body,
      }),
    }),
    listHsnCodes: build.query<
      ApiPaginated<HsnCode>,
      {
        page?: number;
        limit?: number;
        kind?: HsnKind;
        search?: string;
      }
    >({
      query: (args) => ({
        url: "/admin/hsn-codes",
        method: "GET",
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 50,
          kind: args.kind,
          search: args.search,
        },
      }),
      providesTags: ["HsnCodes"],
    }),
    createHsnCode: build.mutation<ApiSuccess<HsnCode>, CreateHsnCodeRequest>({
      query: (body) => ({
        url: "/admin/hsn-codes",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["HsnCodes"],
    }),
    updateHsnCode: build.mutation<
      ApiSuccess<HsnCode>,
      { id: string } & UpdateHsnCodeRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/hsn-codes/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["HsnCodes"],
    }),
    deleteHsnCode: build.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/hsn-codes/${id}`, method: "DELETE" }),
      invalidatesTags: ["HsnCodes"],
    }),
    listUnits: build.query<
      ApiPaginated<UnitOfMeasure>,
      {
        page?: number;
        limit?: number;
        dimension?: UnitDimension;
        search?: string;
      }
    >({
      query: (args) => ({
        url: "/admin/units",
        method: "GET",
        params: {
          page: args.page ?? 1,
          limit: args.limit ?? 50,
          dimension: args.dimension,
          search: args.search,
        },
      }),
      providesTags: ["Units"],
    }),
    createUnit: build.mutation<ApiSuccess<UnitOfMeasure>, CreateUnitRequest>({
      query: (body) => ({ url: "/admin/units", method: "POST", data: body }),
      invalidatesTags: ["Units"],
    }),
    updateUnit: build.mutation<
      ApiSuccess<UnitOfMeasure>,
      { id: string } & UpdateUnitRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/units/${id}`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["Units"],
    }),
    deleteUnit: build.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/admin/units/${id}`, method: "DELETE" }),
      invalidatesTags: ["Units"],
    }),
    commerceSettings: build.query<ApiSuccess<CommerceSettings>, void>({
      query: () => ({ url: "/admin/commerce-settings", method: "GET" }),
      providesTags: ["CommerceSettings"],
    }),
    updateCommerceSettings: build.mutation<
      ApiSuccess<CommerceSettings>,
      UpdateCommerceSettingsRequest
    >({
      query: (body) => ({
        url: "/admin/commerce-settings",
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["CommerceSettings"],
    }),
  }),
});

export const {
  useListTaxClassesQuery,
  useTaxClassDetailQuery,
  useCreateTaxClassMutation,
  useUpdateTaxClassMutation,
  useSetTaxClassStatusMutation,
  useDeleteTaxClassMutation,
  useCreateTaxRateMutation,
  useUpdateTaxRateMutation,
  useDeleteTaxRateMutation,
  useQuoteTaxMutation,
  useListHsnCodesQuery,
  useCreateHsnCodeMutation,
  useUpdateHsnCodeMutation,
  useDeleteHsnCodeMutation,
  useListUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
  useCommerceSettingsQuery,
  useUpdateCommerceSettingsMutation,
} = commerceApi;
