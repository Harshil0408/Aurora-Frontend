import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { SegmentedFilter } from '../SegmentedFilter';

const OPTIONS = [
  { value: 'all', label: 'All', count: 5 },
  { value: 'on', label: 'Active', count: 3, dot: '#059669', ariaLabel: 'Show active (3)' },
  { value: 'off', label: 'Inactive', count: 2 },
] as const;

type V = (typeof OPTIONS)[number]['value'];

describe('SegmentedFilter', () => {
  it('renders labels with count chips and marks the selected pill pressed', () => {
    const onChange = jest.fn();
    renderWithProviders(
      <SegmentedFilter<V> ariaLabel="Filter things" value="on" onChange={onChange} options={[...OPTIONS]} />,
    );
    expect(screen.getByRole('group', { name: 'Filter things' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show active (3)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
    // Counts render as text inside the pills.
    expect(screen.getByRole('button', { name: 'All' })).toHaveTextContent('5');
  });

  it('calls onChange with the clicked value and omits chips when count is absent', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SegmentedFilter<V>
        ariaLabel="Filter things"
        value="all"
        onChange={onChange}
        options={[{ value: 'off', label: 'Inactive' }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Inactive' }));
    expect(onChange).toHaveBeenCalledWith('off');
    expect(screen.getByRole('button', { name: 'Inactive' })).toHaveTextContent('Inactive');
  });
});
