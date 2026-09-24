import { render, screen } from '@/test-utils';
import { KpiLedger } from '@/components/dashboard/KpiLedger';

const items = [
  { key: 'sellers', label: 'Sellers', value: '1,248', deltaPct: 2.1, context: 'vs last week', tint: '#fff', ink: '#111', icon: 'store' as const },
  { key: 'users', label: 'Users', value: '214k', deltaPct: -1.2, context: 'vs last week', tint: '#fff', ink: '#111', icon: 'users' as const },
];

describe('KpiLedger', () => {
  it('renders all KPI cells with values + deltas', () => {
    render(<KpiLedger items={items} />);
    expect(screen.getByText('Sellers')).toBeInTheDocument();
    expect(screen.getByText('1,248')).toBeInTheDocument();
    expect(screen.getByText('2.1%')).toBeInTheDocument();
    expect(screen.getByText('1.2%')).toBeInTheDocument();
  });

  it('exposes section landmark for a11y', () => {
    render(<KpiLedger items={items} />);
    expect(
      screen.getByRole('region', { name: /Key metrics/i }),
    ).toBeInTheDocument();
  });

  it('supports live value ids without crash', () => {
    render(<KpiLedger items={items} liveIds={{ sellers: 'live-sellers' }} />);
    expect(document.getElementById('live-sellers')).toHaveTextContent('1,248');
  });
});
