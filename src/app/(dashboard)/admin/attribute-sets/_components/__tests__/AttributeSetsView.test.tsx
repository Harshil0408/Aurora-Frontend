import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { AttributeSetsView } from "../AttributeSetsView";

const mockList = jest.fn();
const mockAttributes = jest.fn();
const mockDetail = jest.fn();
const mockCan = jest.fn(() => true);

jest.mock("@/services/attributeSetsApi", () => ({
  useListAttributeSetsQuery: (...a: unknown[]) => mockList(...a),
  useAttributeSetDetailQuery: (...a: unknown[]) => mockDetail(...a),
  useSetAttributeSetStatusMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteAttributeSetMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCloneAttributeSetMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCreateAttributeSetMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateAttributeSetMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useCreateAttributeSetGroupMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDeleteAttributeSetGroupMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useAttachAttributeSetItemMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useUpdateAttributeSetItemMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useReorderAttributeSetItemsMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
  useDetachAttributeSetItemMutation: () => [
    jest.fn(),
    { isLoading: false, isError: false },
  ],
}));

jest.mock("@/services/catalogAttributesApi", () => ({
  useListProductAttributesQuery: (...a: unknown[]) => mockAttributes(...a),
  useProductAttributeDetailQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/components/auth/RbacGuard", () => ({
  usePermissions: () => ({ can: mockCan }),
  RbacGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AccessDenied: () => <div>Denied probe</div>,
  Can: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function set(over: Record<string, unknown> = {}) {
  return {
    id: "set-1",
    name: "Electronics Base",
    slug: "electronics-base",
    description: "Core electronics attributes",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    _count: { items: 4, groups: 2, categories: 1 },
    ...over,
  };
}

describe("AttributeSetsView (admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockList.mockReturnValue({
      data: {
        success: true,
        data: [
          set(),
          set({
            id: "set-2",
            name: "Fashion Pro",
            slug: "fashion-pro",
            status: "INACTIVE",
            _count: { items: 0, groups: 0, categories: 0 },
          }),
        ],
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockAttributes.mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockDetail.mockReturnValue({
      data: {
        success: true,
        data: {
          id: "set-1",
          name: "Electronics Base",
          slug: "electronics-base",
          description: "Core electronics attributes",
          status: "ACTIVE",
          items: [
            {
              id: "item-1",
              attributeId: "attr-1",
              groupId: null,
              required: null,
              displayOrder: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              attribute: {
                id: "attr-1",
                name: "RAM Size",
                type: "DROPDOWN",
                unit: null,
                required: false,
              },
            },
          ],
          groups: [
            { id: "group-1", name: "Performance", displayOrder: 1, items: [] },
          ],
          categories: [
            {
              id: "cat-1",
              name: "Electronics",
              slug: "electronics",
              path: "Electronics",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("renders the sets table with counters", async () => {
    renderWithProviders(<AttributeSetsView />);
    expect(await screen.findByText("Sets")).toBeInTheDocument();
    expect(screen.getByText("Electronics Base")).toBeInTheDocument();
    expect(screen.getByText("Fashion Pro")).toBeInTheDocument();
    expect(
      screen.getByText("4 attributes · 2 groups · 1 categories"),
    ).toBeInTheDocument();
  });

  it("opens the create dialog from New set", async () => {
    renderWithProviders(<AttributeSetsView />);
    await userEvent.click(await screen.findByText("New set"));
    expect(
      await screen.findByText("What this set is for (max 500)."),
    ).toBeInTheDocument();
  });

  it("opens the builder for a set", async () => {
    renderWithProviders(<AttributeSetsView />);
    await userEvent.click((await screen.findAllByText("Builder"))[0]);
    expect(
      await screen.findByText("Builder — Electronics Base"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Attach an attribute")).toBeInTheDocument();
  });

  it("opens the clone confirmation", async () => {
    renderWithProviders(<AttributeSetsView />);
    await userEvent.click((await screen.findAllByText("Clone"))[0]);
    expect(
      await screen.findByText(/Clone “Electronics Base”/),
    ).toBeInTheDocument();
  });

  it("shows the denied state without attribute.manage", async () => {
    mockCan.mockImplementation(() => false);
    renderWithProviders(<AttributeSetsView />);
    expect(await screen.findByText("Denied probe")).toBeInTheDocument();
  });
});
