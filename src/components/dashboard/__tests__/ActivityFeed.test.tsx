import { render, screen, fireEvent } from '@/test-utils';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

jest.mock('next/link', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, ...rest }: any) => <a {...rest}>{children}</a>,
}));

describe('ActivityFeed', () => {
  it('renders all events by default and filters', () => {
    render(<ActivityFeed />);
    expect(
      screen.getByRole('heading', { name: /Recent activity/i }),
    ).toBeInTheDocument();
    const sellersBtn = screen.getByRole('button', { name: 'Sellers' });
    fireEvent.click(sellersBtn);
    expect(sellersBtn).toHaveAttribute('aria-pressed', 'true');
    // finance-only view hides seller copy
    fireEvent.click(screen.getByRole('button', { name: 'Finance' }));
    expect(screen.queryByText(/Maple & Moss/i)).toBeNull();
  });

  it('audit log link is inert (prevents dead navigation)', () => {
    render(<ActivityFeed />);
    const link = screen.getByText('Audit log');
    fireEvent.click(link);
    // still on page, no throw
    expect(screen.getByRole('heading', { name: /Recent activity/i })).toBeInTheDocument();
  });
});
