import { makeStore } from "@/store";
import { commerceApi } from "@/services/commerceApi";
import { apiClient } from "@/lib/axios";

jest.mock("@/lib/axios", () => ({
  apiClient: { request: jest.fn() },
}));

const mockedRequest = apiClient.request as jest.Mock;

describe("commerceApi (Module 5 — tax, HSN/SAC, units, settings)", () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it("listTaxClasses GETs with page+limit params", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
      },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.listTaxClasses.initiate({ limit: 100 }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/tax-classes",
      method: "GET",
      data: undefined,
      params: { page: 1, limit: 100, status: undefined, search: undefined },
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("createTaxClass posts name + description", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "tax-1" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.createTaxClass.initiate({
        name: "GST 18%",
        description: "standard slab",
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/tax-classes",
      method: "POST",
      data: { name: "GST 18%", description: "standard slab" },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("setTaxClassStatus patches status with a reason", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "tax-1", status: "INACTIVE" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.setTaxClassStatus.initiate({
        id: "tax-1",
        status: "INACTIVE",
        reason: "Hidden by admin",
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/tax-classes/tax-1/status",
      method: "PATCH",
      data: { status: "INACTIVE", reason: "Hidden by admin" },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("createTaxRate posts under the class with region optional", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "rate-1" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.createTaxRate.initiate({
        id: "tax-1",
        ratePercent: 18,
        cessPercent: 3,
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/tax-classes/tax-1/rates",
      method: "POST",
      data: { ratePercent: 18, cessPercent: 3 },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("deleteTaxRate hits DELETE /admin/tax-classes/:id/rates/:rateId", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { deleted: true } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.deleteTaxRate.initiate({
        id: "tax-1",
        rateId: "rate-1",
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/tax-classes/tax-1/rates/rate-1",
      method: "DELETE",
      data: undefined,
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("quoteTax POSTs the quote preview with optional fields omitted", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          grossAmount: 1000,
          netAmount: 1000,
          taxTotal: 180,
          components: [],
        },
      },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.quoteTax.initiate({
        amount: 1000,
        taxClassId: "tax-1",
        sellerState: "KA",
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/tax/quote",
      method: "POST",
      data: { amount: 1000, taxClassId: "tax-1", sellerState: "KA" },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("listHsnCodes GETs with kind param", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
      },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.listHsnCodes.initiate({ kind: "SAC" }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/hsn-codes",
      method: "GET",
      data: undefined,
      params: { page: 1, limit: 50, kind: "SAC", search: undefined },
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("createHsnCode posts kind + code", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "hsn-1" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.createHsnCode.initiate({
        kind: "HSN",
        code: "8471",
        gstRatePercent: 18,
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/hsn-codes",
      method: "POST",
      data: { kind: "HSN", code: "8471", gstRatePercent: 18 },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("updateHsnCode PATCHes the code", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "hsn-1" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.updateHsnCode.initiate({
        id: "hsn-1",
        description: "Portable computers",
        gstRatePercent: null,
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/hsn-codes/hsn-1",
      method: "PATCH",
      data: { description: "Portable computers", gstRatePercent: null },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("deleteHsnCode hits DELETE /admin/hsn-codes/:id", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { deleted: true } },
    });
    const store = makeStore();
    await store.dispatch(commerceApi.endpoints.deleteHsnCode.initiate("hsn-1"));
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/hsn-codes/hsn-1",
      method: "DELETE",
      data: undefined,
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("listUnits GETs with dimension param", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 1 },
      },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.listUnits.initiate({ dimension: "MASS" }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/units",
      method: "GET",
      data: undefined,
      params: { page: 1, limit: 50, dimension: "MASS", search: undefined },
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("createUnit posts with numeric factor", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "unit-1" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.createUnit.initiate({
        code: "g",
        name: "Gram",
        dimension: "MASS",
        baseCode: "kg",
        factor: 0.001,
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/units",
      method: "POST",
      data: {
        code: "g",
        name: "Gram",
        dimension: "MASS",
        baseCode: "kg",
        factor: 0.001,
      },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("updateUnit patches factor only", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "unit-1" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.updateUnit.initiate({ id: "unit-1", factor: 0.5 }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/units/unit-1",
      method: "PATCH",
      data: { factor: 0.5 },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("deleteUnit hits DELETE /admin/units/:id", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { deleted: true } },
    });
    const store = makeStore();
    await store.dispatch(commerceApi.endpoints.deleteUnit.initiate("unit-1"));
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/units/unit-1",
      method: "DELETE",
      data: undefined,
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("getCommerceSettings GETs the singleton", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: "singleton",
          priceIncludesTax: false,
          baseCurrency: "INR",
          displayCurrency: "INR",
          roundingMode: "NONE",
          updatedById: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      },
    });
    const store = makeStore();
    const res = await store.dispatch(
      commerceApi.endpoints.commerceSettings.initiate(undefined),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/commerce-settings",
      method: "GET",
      data: undefined,
      params: undefined,
    });
    expect(
      (res.data as { data: { baseCurrency: string } }).data.baseCurrency,
    ).toBe("INR");
    store.dispatch(commerceApi.util.resetApiState());
  });

  it("updateCommerceSettings PATCHes the singleton", async () => {
    mockedRequest.mockResolvedValueOnce({
      data: { success: true, data: { id: "singleton" } },
    });
    const store = makeStore();
    await store.dispatch(
      commerceApi.endpoints.updateCommerceSettings.initiate({
        priceIncludesTax: true,
        roundingMode: "ROUND_HALF_UP",
      }),
    );
    expect(mockedRequest).toHaveBeenCalledWith({
      url: "/admin/commerce-settings",
      method: "PATCH",
      data: { priceIncludesTax: true, roundingMode: "ROUND_HALF_UP" },
      params: undefined,
    });
    store.dispatch(commerceApi.util.resetApiState());
  });
});
