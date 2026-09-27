import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { Button } from '@mui/material';
import { TableCard } from '../TableCard';

describe('TableCard', () => {
  it('renders title, subtitle, actions, body, and footer', () => {
    renderWithProviders(
      <TableCard
        title="Team members"
        subtitle="5 admins · 1 needs attention"
        actions={<Button size="small">Export</Button>}
        footer={<span>Showing 1–5 of 8</span>}
      >
        <p>Table body</p>
      </TableCard>,
    );
    expect(screen.getByRole('heading', { name: 'Team members' })).toBeInTheDocument();
    expect(screen.getByText(/5 admins/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByText('Table body')).toBeInTheDocument();
    expect(screen.getByText('Showing 1–5 of 8')).toBeInTheDocument();
  });

  it('swaps body for a helpful empty state with recovery action', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    renderWithProviders(
      <TableCard
        title="Events"
        empty={{
          when: true,
          title: 'No events match these filters',
          description: 'Try widening the date range.',
          actionLabel: 'Clear filters',
          onAction,
        }}
      >
        <p>Hidden table</p>
      </TableCard>,
    );
    expect(screen.queryByText('Hidden table')).toBeNull();
    expect(screen.getByText('No events match these filters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('keeps the toolbar up while the body shows the empty state', () => {
    renderWithProviders(
      <TableCard
        title="Events"
        toolbar={<span>Filter row</span>}
        empty={{ when: true, title: 'Nothing here' }}
      >
        <p>Hidden table</p>
      </TableCard>,
    );
    expect(screen.getByText('Filter row')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('Hidden table')).toBeNull();
  });
});
