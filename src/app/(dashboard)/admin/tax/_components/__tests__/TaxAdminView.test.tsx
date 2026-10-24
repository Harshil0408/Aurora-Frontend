import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { TaxAdminView } from "../TaxAdminView";

const mockClassList = jest.fn();
const mockHsnList = jest.fn();
const mockUnitList = jest.fn();
const mockRatesDetail = jest.fn();
const mockSettings = jest.fn();
const mockCan = jest.fn(() => true);

jest.mock("@/services/commerceApi", () => ({
  useListTaxClassesQuery: (...a: unknown[]) => mockClassList(...a),
  useListHsnCodesQuery: (...a: unknown[]) => mockHsnList(...a),
  useListUnitsQuery: (...a: unknown[]) => mockUnitList(...a),
  useTaxClassDetailQuery: (...a: unknown[]) => mockRatesDetail(...a),
  useCommerceSettingsQuery: (...a: unknown[]) => mockSettings(...a),
  useSetTaxClassStatusMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteTaxClassMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCreateTaxClassMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateTaxClassMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCreateTaxRateMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateTaxRateMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteTaxRateMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useQuoteTaxMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useCreateHsnCodeMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateHsnCodeMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteHsnCodeMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCreateUnitMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateUnitMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteUnitMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateCommerceSettingsMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
}));

jest.mock("@/components/auth/RbacGuard", () => ({
  usePermissions: () => ({ can: mockCan }),
  RbacGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AccessDenied: () => <div>Denied probe</div>,
  Can: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function taxClass(over: Record<string, unknown> = {}) {
  return {
    id: "tax-1",
    name: "GST 18%",
    description: "Standard slab",
    status: "ACTIVE",
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    rates: [
      {
        id: "rate-1",
        taxClassId: "tax-1",
        region: "ALL",
        ratePercent: "18",
        cessPercent: "0",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    _count: { categories: 0 },
    ...over,
  };
}

function hsn(over: Record<string, unknown> = {}) {
  return {
    id: "hsn-1",
    kind: "HSN",
    code: "8471",
    description: "Computers",
    gstRatePercent: "18",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function unit(over: Record<string, unknown> = {}) {
  return {
    id: "unit-1",
    code: "g",
    name: "Gram",
    dimension: "MASS",
    baseCode: "kg",
    factor: "0.001",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("TaxAdminView (admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockClassList.mockReturnValue({
      data: {
        success: true,
        data: [
          taxClass(),
          taxClass({ id: "tax-2", name: "GST 5%", status: "INACTIVE" }),
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockHsnList.mockReturnValue({
      data: { success: true, data: [hsn()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUnitList.mockReturnValue({
      data: { success: true, data: [unit()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockRatesDetail.mockReturnValue({
      data: { success: true, data: taxClass() },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockSettings.mockReturnValue({
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
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("renders the four tabs and the tax-class rows with status chips", async () => {
    renderWithProviders(<TaxAdminView />);
    expect(await screen.findByText("Tax & Units")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Tax classes" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "HSN / SAC" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Units" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("GST 18%")).toBeInTheDocument();
    expect(screen.getByText("GST 5%")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  it("summarises rate rows on the class list", async () => {
    renderWithProviders(<TaxAdminView />);
    expect((await screen.findAllByText("ALL 18%")).length).toBe(2);
  });

  it("switches to the HSN / SAC tab", async () => {
    renderWithProviders(<TaxAdminView />);
    await userEvent.click(
      await screen.findByRole("tab", { name: "HSN / SAC" }),
    );
    expect(await screen.findByText("HSN / SAC master")).toBeInTheDocument();
    expect(await screen.findByText("New code")).toBeInTheDocument();
    expect(screen.getByText("8471")).toBeInTheDocument();
  });

  it("switches to the Units tab", async () => {
    renderWithProviders(<TaxAdminView />);
    await userEvent.click(await screen.findByRole("tab", { name: "Units" }));
    expect(await screen.findByText("Units of measure")).toBeInTheDocument();
    expect(await screen.findByText("New unit")).toBeInTheDocument();
    expect(screen.getByText("g")).toBeInTheDocument();
  });

  it("switches to the Settings tab and shows the loaded rounding mode", async () => {
    renderWithProviders(<TaxAdminView />);
    await userEvent.click(await screen.findByRole("tab", { name: "Settings" }));
    expect(await screen.findByText("Pricing settings")).toBeInTheDocument();
    expect((await screen.findAllByDisplayValue("INR")).length).toBe(2);
    expect(await screen.findByText("None (keep paise)")).toBeInTheDocument();
  });

  it("opens the class create dialog from New class", async () => {
    renderWithProviders(<TaxAdminView />);
    await userEvent.click(await screen.findByText("New class"));
    expect(await screen.findByText("New tax class")).toBeInTheDocument();
  });

  it(
    "opens the Rates drawer for a class",
    async () => {
      renderWithProviders(<TaxAdminView />);
      await userEvent.click(
        (await screen.findAllByRole("button", { name: "Rates" }))[0],
      );
      expect(await screen.findByText("Rates — GST 18%")).toBeInTheDocument();
      expect(await screen.findByText("Add rate")).toBeInTheDocument();
      expect(
        await screen.findByRole("cell", { name: "18%" }),
      ).toBeInTheDocument();
    },
    // The drawer mounts the full form subtree; slow CI/dev machines exceed 10s.
    20000,
  );

  it("shows the denied state without tax.manage", async () => {
    mockCan.mockImplementation(() => false);
    renderWithProviders(<TaxAdminView />);
    expect(await screen.findByText("Denied probe")).toBeInTheDocument();
  });
});
