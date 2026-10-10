import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { LookupSelect } from '../LookupSelect';

const mockListQuery = jest.fn();

jest.mock('@/services/attributesApi', () => ({
  useListAttributesQuery: (...args: unknown[]) => mockListQuery(...args),
}));

const COUNTRY_ROWS = [
  {
    id: '1',
    type: 'country',
    key: 'india',
    label: 'India',
    value: '+91',
    description: null,
    metadata: null,
    sortOrder: 0,
    status: 'ACTIVE',
    isSystem: false,
    createdAt: '2026-01-04T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: '2',
    type: 'country',
    key: 'france',
    label: 'France',
    value: null,
    description: null,
    metadata: null,
    sortOrder: 1,
    status: 'ACTIVE',
    isSystem: false,
    createdAt: '2026-01-04T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
  },
];

function live() {
  mockListQuery.mockReturnValue({
    data: {
      success: true,
      data: COUNTRY_ROWS,
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    },
    isLoading: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LookupSelect (dynamic catalog dropdown)', () => {
  it('renders live catalog options, storing the admin payload value', async () => {
    live();
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithProviders(
      <LookupSelect field="country" label="Country" value="" onChange={onChange} />,
    );
    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    // Payload rows show "Label (code)"; key-only rows show the plain label.
    expect(await screen.findByRole('option', { name: 'India (+91)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'France' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'India (+91)' }));
    expect(onChange).toHaveBeenCalledWith('+91');
    expect(mockListQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'country', status: 'ACTIVE' }),
    );
  });

  it('shows a fallback message with an empty dropdown when the catalog errors', async () => {
    mockListQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const user = userEvent.setup();
    renderWithProviders(
      <LookupSelect field="country" label="Country" value="" onChange={() => {}} />,
    );
    expect(await screen.findByText(/couldn't load the live country list/i)).toBeInTheDocument();
    // No preset options and no manual typing — the dropdown stays empty.
    const select = screen.getByRole('combobox', { name: 'Country' });
    expect(select).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('textbox', { name: 'Country' })).not.toBeInTheDocument();
    await user.click(select);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('shows a fallback message with an empty dropdown when the list is still empty', async () => {
    mockListQuery.mockReturnValue({
      data: { success: true, data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } },
      isLoading: false,
    });
    renderWithProviders(
      <LookupSelect field="currency" label="Currency" value="" onChange={() => {}} />,
    );
    expect(await screen.findByText(/no currency options yet/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Currency' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('preserves a saved value missing from the list instead of blanking', async () => {
    live();
    renderWithProviders(
      <LookupSelect field="country" label="Country" value="atlantis" onChange={() => {}} />,
    );
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveTextContent('atlantis');
  });

  it('shows a loading state while the catalog resolves', () => {
    mockListQuery.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(
      <LookupSelect field="timezone" label="Timezone" value="" onChange={() => {}} />,
    );
    expect(screen.getByRole('textbox', { name: 'Timezone' })).toBeDisabled();
  });
});
