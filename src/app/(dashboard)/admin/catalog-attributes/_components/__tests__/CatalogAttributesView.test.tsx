import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { CatalogAttributesView } from "../CatalogAttributesView";

const mockList = jest.fn();
const mockSuggestions = jest.fn();
const mockDetail = jest.fn();
const mockCan = jest.fn(() => true);

jest.mock("@/services/catalogAttributesApi", () => ({
  useListProductAttributesQuery: (...a: unknown[]) => mockList(...a),
  useOptionSuggestionsQuery: (...a: unknown[]) => mockSuggestions(...a),
  useProductAttributeDetailQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  useSetProductAttributeStatusMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useAddProductAttributeOptionMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateProductAttributeOptionMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteProductAttributeOptionMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useReorderProductAttributeOptionsMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useReviewOptionSuggestionMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCreateProductAttributeMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateProductAttributeMutation: () => [
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

function attribute(over: Record<string, unknown> = {}) {
  return {
    id: "attr-1",
    name: "RAM Size",
    code: "ram_size",
    type: "DROPDOWN",
    unit: null,
    helpText: null,
    required: false,
    filterable: true,
    searchable: false,
    comparable: false,
    variantDefining: false,
    visibleOnPage: true,
    validationMin: null,
    validationMax: null,
    validationRegex: null,
    allowedUnits: [],
    status: "ACTIVE",
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    _count: { options: 3, items: 1 },
    ...over,
  };
}

describe("CatalogAttributesView (admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockList.mockReturnValue({
      data: {
        success: true,
        data: [
          attribute(),
          attribute({
            id: "attr-2",
            name: "Warranty Years",
            code: "warranty_years",
            type: "NUMBER",
            unit: "years",
            required: true,
            variantDefining: false,
            filterable: false,
            _count: { options: 0, items: 0 },
          }),
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockSuggestions.mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("renders the attribute catalog with type and flag chips", async () => {
    renderWithProviders(<CatalogAttributesView />);
    expect(await screen.findByText("Attribute catalog")).toBeInTheDocument();
    expect(screen.getByText("RAM Size")).toBeInTheDocument();
    expect(screen.getByText("Warranty Years")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("New attribute")).toBeInTheDocument();
  });

  it("searches by name or code", async () => {
    renderWithProviders(<CatalogAttributesView />);
    const input = await screen.findByPlaceholderText("Search name, code…");
    await userEvent.type(input, "warranty_years");
    expect(await screen.findByText("Warranty Years")).toBeInTheDocument();
    expect(screen.queryByText("RAM Size")).not.toBeInTheDocument();
  });

  it("switches to the suggestions queue tab", async () => {
    renderWithProviders(<CatalogAttributesView />);
    await userEvent.click(
      await screen.findByRole("tab", { name: /Suggestions/ }),
    );
    expect(
      await screen.findByText("Seller option suggestions"),
    ).toBeInTheDocument();
  });

  it("shows the denied state without attribute.manage", async () => {
    mockCan.mockImplementation(() => false);
    renderWithProviders(<CatalogAttributesView />);
    expect(await screen.findByText("Denied probe")).toBeInTheDocument();
  });

  it("opens the create dialog from New attribute", async () => {
    renderWithProviders(<CatalogAttributesView />);
    await userEvent.click(await screen.findByText("New attribute"));
    expect(
      await screen.findByText("New product attribute"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Defines variants")).toBeInTheDocument();
  });
});
