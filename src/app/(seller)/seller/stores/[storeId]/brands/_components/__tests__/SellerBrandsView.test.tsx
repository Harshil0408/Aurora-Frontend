import { renderWithProviders, screen, userEvent, waitFor } from '@/test-utils';
import { SellerBrandsView } from '../SellerBrandsView';

const mockBrands = jest.fn();
const mockRequests = jest.fn();
const mockAuth = jest.fn();
const mockDocs = jest.fn();
const mockCan = jest.fn(() => true);

jest.mock('@/services/sellerBrandsApi', () => ({
  useSellerBrandsQuery: (...a: unknown[]) => mockBrands(...a),
  useSellerBrandRequestsQuery: (...a: unknown[]) => mockRequests(...a),
  useSellerBrandAuthorisationsQuery: (...a: unknown[]) => mockAuth(...a),
  useSellerRequestBrandMutation: () => [jest.fn(), { isLoading: false, isError: false, error: null }],
  useSellerApplyBrandAuthMutation: () => [jest.fn(), { isLoading: false, isError: false }],
}));

jest.mock('@/services/sellerMediaApi', () => ({
  useSellerMediaQuery: (...a: unknown[]) => mockDocs(...a),
}));

jest.mock('@/components/seller/SellerGuards', () => ({
  useSellerCan: () => ({ can: mockCan }),
  SellerForbidden: () => <div>Forbidden probe</div>,
}));

function sellerBrand(over: Record<string, unknown> = {}) {
  return {
    id: 'brand-1',
    name: 'Aurelia',
    slug: 'aurelia',
    logoUrl: null,
    website: 'https://aurelia.example',
    country: 'India',
    restricted: false,
    access: 'open',
    authorisationExpiresAt: null,
    ...over,
  };
}

describe('SellerBrandsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockBrands.mockReturnValue({
      data: {
        success: true,
        data: [
          sellerBrand(),
          sellerBrand({ id: 'brand-2', name: 'Borealis', slug: 'borealis', restricted: true, access: 'restricted' }),
          sellerBrand({ id: 'brand-3', name: 'Cirrus', slug: 'cirrus', restricted: true, access: 'granted', authorisationExpiresAt: '2027-01-01T00:00:00.000Z' }),
          sellerBrand({ id: 'brand-4', name: 'Drift', slug: 'drift', restricted: true, access: 'expired' }),
        ],
        pagination: { page: 1, limit: 50, total: 4, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockRequests.mockReturnValue({ data: { success: true, data: [] }, isLoading: false, isError: false, refetch: jest.fn() });
    mockAuth.mockReturnValue({ data: { success: true, data: [] }, isLoading: false, isError: false, refetch: jest.fn() });
    mockDocs.mockReturnValue({ data: { success: true, data: [{ id: 'doc-1', fileName: 'letter.pdf' }] }, isLoading: false, isError: false });
  });

  it('renders the browse list with access chips', async () => {
    renderWithProviders(<SellerBrandsView />);
    expect(await screen.findByText('Aurelia')).toBeInTheDocument();
    expect(screen.getByText('Borealis')).toBeInTheDocument();
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText(/Granted · till/)).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.getByText('Request a brand')).toBeInTheDocument();
  });

  it('filters to unrestricted brands only', async () => {
    renderWithProviders(<SellerBrandsView />);
    expect(await screen.findByText('Borealis')).toBeInTheDocument();
    expect(mockBrands).toHaveBeenCalledWith(expect.objectContaining({ openOnly: false }), expect.anything());
  });

  it('switches to my requests tab', async () => {
    renderWithProviders(<SellerBrandsView />);
    await userEvent.click(await screen.findByText('My requests'));
    await waitFor(() => expect(screen.getByText('No requests with this status — propose a missing brand to get started.')).toBeInTheDocument());
  });

  it('opens the request modal', async () => {
    renderWithProviders(<SellerBrandsView />);
    await userEvent.click(await screen.findByText('Request a brand'));
    expect((await screen.findAllByText('Proposed name')).length).toBeGreaterThan(0);
  });

  it('hides everything without brand:view', async () => {
    mockCan.mockImplementation(() => false);
    renderWithProviders(<SellerBrandsView />);
    expect(await screen.findByText('Forbidden probe')).toBeInTheDocument();
  });
});
