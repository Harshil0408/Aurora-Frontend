import { render, screen } from '@/test-utils';
import { Delta } from '@/components/dashboard/Delta';

describe('Delta', () => {
  it('formats positive pct with one decimal', () => {
    render(<Delta pct={12.345} />);
    expect(screen.getByText('12.3%')).toBeInTheDocument();
  });

  it('formats negative pct as absolute value (icon carries direction)', () => {
    render(<Delta pct={-2.34} />);
    // Math.abs + toFixed(1) => 2.3%
    expect(screen.getByText('2.3%')).toBeInTheDocument();
  });

  it('treats zero as up (no crash on boundary)', () => {
    render(<Delta pct={0} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
