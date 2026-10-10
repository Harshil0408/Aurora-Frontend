import { renderWithProviders, screen } from '@/test-utils';
import { AttributesView } from '../AttributesView';

const mockTypesQuery = jest.fn();
const mockCreateMutation = jest.fn();
const mockMyPermsQuery = jest.fn();
const mockMeQuery = jest.fn();
const mockPush = jest.fn();

jest.mock('@/services/attributesApi', () => ({
  useAttributeTypesQuery: (...args: unknown[]) => mockTypesQuery(...args),
  useCreateAttributeMutation: () => [mockCreateMutation, { isLoading: false }],
  useUpdateAttributeMutation: () => [jest.fn(), { isLoading: false }],
  useSetAttributeStatusMutation: () => [jest.fn(), { isLoading: false }],
  useDeleteAttributeMutation: () => [jest.fn(), { isLoading: false }],
}));

jest.mock('@/services/authApi', () => ({
  useMeQuery: (...args: unknown[]) => mockMeQuery(...args),
}));

jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: (...args: unknown[]) => mockMyPermsQuery(...args),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const TYPES = [
  { type: 'payment_type', count: 4 },
  { type: 'country', count: 12 },
  { type: 'seller_badge', count: 3 },
];

function perms(...keys: string[]) {
  mockMyPermsQuery.mockReturnValue({
    data: { data: { permissions: keys } },
    isLoading: false,
  });
  mockMeQuery.mockReturnValue({
    data: { data: { email: 'aisha@mercato.com', roles: ['super_admin'] } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  perms('attribute.read', 'attribute.create');
  mockTypesQuery.mockReturnValue({
    data: { success: true, data: TYPES },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

describe('AttributesView (types overview)', () => {
  it('renders one card per lookup type with counts', async () => {
    renderWithProviders(<AttributesView scope={null} />);
    expect(await screen.findByText('Payment Type')).toBeInTheDocument();
    expect(screen.getByText('12 entries')).toBeInTheDocument();
    expect(screen.getByText(/3 types · 19 entries/)).toBeInTheDocument();
  });

  it('filters cards to the sidebar scope without refetching', async () => {
    renderWithProviders(<AttributesView scope="seller" />);
    expect(await screen.findByText('Seller Badge')).toBeInTheDocument();
    expect(screen.queryByText('Payment Type')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows the first-run empty state when no types exist', async () => {
    mockTypesQuery.mockReturnValue({
      data: { success: true, data: [] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    renderWithProviders(<AttributesView scope={null} />);
    expect(await screen.findByText('No lookup types yet')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create the first attribute/i }),
    ).toBeInTheDocument();
  });

  it('hides the Add button without attribute.create', async () => {
    perms('attribute.read');
    renderWithProviders(<AttributesView scope={null} />);
    expect(await screen.findByText('Payment Type')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add entry/i })).not.toBeInTheDocument();
  });

  it('renders the restricted state on 403 instead of retrying', async () => {
    mockTypesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 403, data: { success: false, error: { code: 'FORBIDDEN', message: 'Nope' } } },
      refetch: jest.fn(),
    });
    renderWithProviders(<AttributesView scope={null} />);
    expect(await screen.findByText('Attributes are restricted')).toBeInTheDocument();
  });
});
