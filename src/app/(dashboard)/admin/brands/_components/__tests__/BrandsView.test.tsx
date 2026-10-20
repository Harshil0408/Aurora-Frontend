import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { BrandsView } from '../BrandsView';

const mockBrands = jest.fn();
const mockRequests = jest.fn();
const mockAuth = jest.fn();
const mockExport = jest.fn();
const mockCan = jest.fn(() => true);

jest.mock('@/services/brandsApi', () => ({
  useListBrandsQuery: (...a: unknown[]) => mockBrands(...a),
  useBrandRequestsQuery: (...a: unknown[]) => mockRequests(...a),
  useBrandAuthorisationsQuery: (...a: unknown[]) => mockAuth(...a),
  useSetBrandStatusMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useMergeBrandMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useImportBrandsMutation: () => [jest.fn(), { isLoading: false, isError: false, data: undefined }],
  useExportBrandsQuery: () => ({ refetch: jest.fn(() => Promise.resolve({ data: { success: true, data: [] } })) }),
  useReviewBrandRequestMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useReviewBrandAuthorisationMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useCreateBrandMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useUpdateBrandMutation: () => [jest.fn(), { isLoading: false, isError: false }],
}));

jest.mock('@/components/auth/RbacGuard', () => ({
  usePermissions: () => ({ can: mockCan }),
  RbacGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AccessDenied: () => <div>Denied probe</div>,
  Can: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function brand(over: Record<string, unknown> = {}) {
  return {
    id: 'brand-1',
    name: 'Aurelia',
    slug: 'aurelia',
    logoUrl: null,
    bannerUrl: null,
    description: 'Heritage jewellery',
    website: 'https://aurelia.example',
    country: 'India',
    status: 'ACTIVE',
    restricted: false,
    featured: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('BrandsView (admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockBrands.mockReturnValue({
      data: { success: true, data: [brand(), brand({ id: 'brand-2', name: 'Borealis', slug: 'borealis', restricted: true, featured: true })] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockRequests.mockReturnValue({ data: { success: true, data: [] }, isLoading: false, isError: false, refetch: jest.fn() });
    mockAuth.mockReturnValue({ data: { success: true, data: [] }, isLoading: false, isError: false, refetch: jest.fn() });
    mockExport.mockReturnValue({ refetch: jest.fn() });
  });

  it('renders the brand master with restricted and featured chips', async () => {
    renderWithProviders(<BrandsView />);
    expect(await screen.findByText('Brands')).toBeInTheDocument();
    expect(screen.getByText('Aurelia')).toBeInTheDocument();
    expect(screen.getByText('Borealis')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('New brand')).toBeInTheDocument();
  });

  it('opens the create dialog from New brand', async () => {
    renderWithProviders(<BrandsView />);
    await userEvent.click(await screen.findByText('New brand'));
    expect(await screen.findByText('Slugs auto-generate from the name; duplicate names are rejected — merge instead.')).toBeInTheDocument();
  });

  it('switches to the requests queue tab', async () => {
    renderWithProviders(<BrandsView />);
    await userEvent.click(await screen.findByText('Seller requests'));
    expect(await screen.findByText('Seller brand requests')).toBeInTheDocument();
  });

  it('shows the denied state without brand.manage', async () => {
    mockCan.mockImplementation(() => false);
    renderWithProviders(<BrandsView />);
    expect(await screen.findByText('Denied probe')).toBeInTheDocument();
  });

  it('opens the merge dialog with a survivor select', async () => {
    renderWithProviders(<BrandsView />);
    const mergeButtons = await screen.findAllByText('Merge');
    const target = mergeButtons[0] ?? mergeButtons[mergeButtons.length - 1];
    await userEvent.click(target ?? document.body);
    expect(await screen.findByText(/Merge “Aurelia” into…/)).toBeInTheDocument();
    expect((await screen.findAllByText('Surviving brand')).length).toBeGreaterThan(0);
  });
});
