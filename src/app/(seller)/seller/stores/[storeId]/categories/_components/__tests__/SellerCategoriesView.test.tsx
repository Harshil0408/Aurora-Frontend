import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { SellerCategoriesView } from '../SellerCategoriesView';

const mockTree = jest.fn();
const mockRequests = jest.fn();
const mockAccess = jest.fn();
const mockCan = jest.fn((_p?: string) => true);

jest.mock('@/services/sellerCategoriesApi', () => ({
  useSellerCategoryTreeQuery: (...a: unknown[]) => mockTree(...a),
  useSellerCategoryRequestsQuery: (...a: unknown[]) => mockRequests(...a),
  useSellerCategoryAccessQuery: (...a: unknown[]) => mockAccess(...a),
  useSellerRequestCategoryMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useSellerApplyCategoryAccessMutation: () => [jest.fn(), { isLoading: false, isError: false }],
}));

jest.mock('@/services/sellerMediaApi', () => ({
  useSellerMediaQuery: () => ({ data: { success: true, data: [] }, isLoading: false }),
}));

jest.mock('@/components/seller/SellerGuards', () => ({
  useSellerCan: () => ({ can: mockCan }),
  SellerForbidden: () => <div>Forbidden probe</div>,
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ storeId: 'store-1' }),
}));

function node(overrides = {}) {
  return {
    id: 'cat-1',
    parentId: null,
    name: 'Pharmacy',
    slug: 'pharmacy',
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
    breadcrumb: 'Pharmacy',
    access: 'restricted',
    children: [],
    ...overrides,
  };
}

describe('SellerCategoriesView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockTree.mockReturnValue({
      data: { success: true, data: [node()] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockRequests.mockReturnValue({ data: { success: true, data: [] }, isLoading: false });
    mockAccess.mockReturnValue({ data: { success: true, data: [] }, isLoading: false });
  });

  it('renders restricted branches with an apply action', async () => {
    renderWithProviders(<SellerCategoriesView />);
    expect(await screen.findByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('opens the request-category dialog', async () => {
    renderWithProviders(<SellerCategoriesView />);
    await userEvent.click(await screen.findByText('Request a category'));
    expect(await screen.findByText('An admin reviews every proposal — approvals link to the real category.')).toBeInTheDocument();
  });

  it('shows the forbidden state without category:view', async () => {
    mockCan.mockImplementation((p?: string) => p !== 'category:view');
    renderWithProviders(<SellerCategoriesView />);
    expect(await screen.findByText('Forbidden probe')).toBeInTheDocument();
  });
});
