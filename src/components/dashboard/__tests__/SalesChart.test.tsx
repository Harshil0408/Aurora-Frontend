import { render, screen, fireEvent } from '@/test-utils';
import { SalesChart } from '@/components/dashboard/SalesChart';

describe('SalesChart', () => {
  it('renders heading + range tabs with selection', () => {
    render(<SalesChart />);
    expect(
      screen.getByRole('heading', { name: /Sales overview/i }),
    ).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }));
    expect(
      screen.getByRole('tab', { name: 'Weekly' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('exposes keyboard-readable chart with summary live region', () => {
    render(<SalesChart />);
    expect(
      screen.getByRole('img', { name: /Sales chart/i }),
    ).toBeInTheDocument();
    // gross sales / orders / aov summary
    expect(screen.getByText('Gross sales')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  it('arrow keys move hover without crashing (a11y)', () => {
    render(<SalesChart />);
    const chart = screen.getByRole('img', { name: /Sales chart/i });
    chart.focus();
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    fireEvent.keyDown(chart, { key: 'ArrowLeft' });
    fireEvent.keyDown(chart, { key: 'Escape' });
    expect(chart).toBeInTheDocument();
  });
});
