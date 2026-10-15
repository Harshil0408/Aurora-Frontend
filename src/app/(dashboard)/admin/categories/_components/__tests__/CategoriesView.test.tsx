import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { CategoriesView } from '../CategoriesView';

const mockTree = jest.fn();
const mockRequests = jest.fn();
const mockAccess = jest.fn();
const mockCan = jest.fn(() => true);

jest.mock('@/services/categoriesApi', () => ({
  useCategoryTreeQuery: (...a: unknown[]) => mockTree(...a),
  useListCategoriesQuery: jest.fn(() => ({ data: undefined, isLoading: false })),
  useCategoryRequestsQuery: (...a: unknown[]) => mockRequests(...a),
  useCategoryAccessQueueQuery: (...a: unknown[]) => mockAccess(...a),
  useDeleteCategoryMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useExportCategoriesQuery: () => ({ refetch: jest.fn() }),
  useImportCategoriesMutation: () => [jest.fn(), { isLoading: false, isError: false, data: undefined }],
  useReviewCategoryRequestMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useReviewCategoryAccessMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useSetCategoryStatusMutation: () => [jest.fn(), { isLoading: false }],
  useCreateCategoryMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useUpdateCategoryMutation: () => [jest.fn(), { isLoading: false, isError: false }],
}));

jest.mock('@/components/auth/RbacGuard', () => ({
  usePermissions: () => ({ can: mockCan }),
  RbacGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AccessDenied: () => <div>Denied probe</div>,
  Can: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function node() {
  return {
    id: 'cat-1',
    parentId: null,
    name: 'Fashion',
    slug: 'fashion',
    description: null,
    imageUrl: null,
    bannerUrl: null,
    icon: null,
    displayOrder: 0,
    status: 'ACTIVE',
    showInNav: true,
    showOnHomepage: false,
    restricted: false,
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    ogImageUrl: null,
    attributeSetId: null,
    taxClassId: null,
    commissionRateBps: null,
    returnWindowDays: null,
    childCount: 1,
    leaf: false,
    breadcrumb: 'Fashion',
    children: [
      {
        id: 'cat-2',
        parentId: 'cat-1',
        name: 'Kurtas',
        slug: 'kurtas',
        description: null,
        imageUrl: null,
        bannerUrl: null,
        icon: null,
        displayOrder: 0,
        status: 'ACTIVE',
        showInNav: true,
        showOnHomepage: false,
        restricted: true,
        metaTitle: null,
        metaDescription: null,
        canonicalUrl: null,
        ogImageUrl: null,
        attributeSetId: null,
        taxClassId: null,
        commissionRateBps: null,
        returnWindowDays: null,
        childCount: 0,
        leaf: true,
        breadcrumb: 'Fashion / Kurtas',
        children: [],
      },
    ],
  };
}

describe('CategoriesView (admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockTree.mockReturnValue({
      data: { success: true, data: [node()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockRequests.mockReturnValue({ data: { success: true, data: [] }, isLoading: false, isError: false, refetch: jest.fn() });
    mockAccess.mockReturnValue({ data: { success: true, data: [] }, isLoading: false, isError: false, refetch: jest.fn() });
  });

  it('renders the tree with breadcrumbs, leaf counts, and restricted flags', async () => {
    renderWithProviders(<CategoriesView />);
    expect(await screen.findByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Kurtas')).toBeInTheDocument();
    expect(screen.getByText('Fashion / Kurtas')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('New category')).toBeInTheDocument();
  });

  it('opens the create dialog from New category', async () => {
    renderWithProviders(<CategoriesView />);
    await userEvent.click(await screen.findByText('New category'));
    expect(await screen.findByText('Slugs auto-generate from the name; rename-safe redirects are automatic.')).toBeInTheDocument();
  });

  it('switches to the requests queue tab', async () => {
    renderWithProviders(<CategoriesView />);
    await userEvent.click(await screen.findByText('Seller requests'));
    expect(await screen.findByText('Seller category requests')).toBeInTheDocument();
  });

  it('shows the denied state without category.manage', async () => {
    mockCan.mockImplementation(() => false);
    renderWithProviders(<CategoriesView />);
    expect(await screen.findByText('Denied probe')).toBeInTheDocument();
  });
});
