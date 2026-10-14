import { renderWithProviders, screen } from '@/test-utils';
import { MediaLibraryView } from '../MediaLibraryView';

const mockMediaQuery = jest.fn();
const mockQuotaQuery = jest.fn();
const mockRefetch = jest.fn();
const mockCan = jest.fn((_perm: string) => true);

jest.mock('@/services/sellerMediaApi', () => ({
  useSellerMediaQuery: (...args: unknown[]) => mockMediaQuery(...args),
  useSellerMediaQuotaQuery: (...args: unknown[]) => mockQuotaQuery(...args),
  useSellerUpdateMediaMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useSellerDeleteMediaMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  useSellerCleanupOrphansMutation: () => [jest.fn(), { isLoading: false, isError: false }],
  formatBytes: (n: number) => `${n} B`,
  uploadMediaFiles: jest.fn(),
}));

jest.mock('@/components/seller/SellerGuards', () => ({
  useSellerCan: () => ({ can: mockCan }),
  SellerForbidden: () => <div>Forbidden probe</div>,
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ storeId: 'store-1' }),
}));

function asset(overrides = {}) {
  return {
    id: 'asset-1',
    storeId: 'store-1',
    fileName: 'kurta.png',
    originalName: 'kurta.png',
    mime: 'image/png',
    sizeBytes: 68234,
    checksum: 'abc',
    kind: 'IMAGE',
    visibility: 'PUBLIC',
    status: 'READY',
    storageKey: 'public/stores/store-1/kurta.png',
    url: '/uploads/public/stores/store-1/kurta.png',
    width: null,
    height: null,
    altText: 'Red kurta',
    caption: null,
    folder: 'products',
    tags: [],
    usageCount: 0,
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
    ...overrides,
  };
}

function pagePayload(rows: unknown[], total = 1) {
  return {
    data: {
      success: true,
      data: rows,
      pagination: { page: 1, limit: 24, total, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  };
}

describe('MediaLibraryView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockImplementation(() => true);
    mockMediaQuery.mockReturnValue(pagePayload([asset()]));
    mockQuotaQuery.mockReturnValue({
      data: { success: true, data: { usedBytes: 68234, limitBytes: 104857600, percent: 0.1, assetCount: 1 } },
      refetch: jest.fn(),
    });
  });

  it('renders the library grid, quota, and uploader for permitted sellers', async () => {
    renderWithProviders(<MediaLibraryView />);
    expect(await screen.findByText('Media library')).toBeInTheDocument();
    expect(screen.getByText('kurta.png')).toBeInTheDocument();
    expect(screen.getByText('Browse files')).toBeInTheDocument();
    expect(screen.getByText(/Storage/)).toBeInTheDocument();
  });

  it('disables delete while the asset is in use', async () => {
    mockMediaQuery.mockReturnValue(pagePayload([asset({ id: 'used-1', fileName: 'used.png', usageCount: 3 })]));
    renderWithProviders(<MediaLibraryView />);
    expect(await screen.findByText('used.png')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete used.png')).toBeDisabled();
    expect(screen.getByText('Used ×3')).toBeInTheDocument();
  });

  it('shows the forbidden state without media:view', async () => {
    mockCan.mockImplementation((p: string) => p !== 'media:view');
    renderWithProviders(<MediaLibraryView />);
    expect(await screen.findByText('Forbidden probe')).toBeInTheDocument();
  });

  it('shows an empty state when the library has no assets', async () => {
    mockMediaQuery.mockReturnValue(pagePayload([], 0));
    mockQuotaQuery.mockReturnValue({
      data: { success: true, data: { usedBytes: 0, limitBytes: 104857600, percent: 0, assetCount: 0 } },
      refetch: jest.fn(),
    });
    renderWithProviders(<MediaLibraryView />);
    expect(await screen.findByText(/No assets yet/)).toBeInTheDocument();
  });
});
