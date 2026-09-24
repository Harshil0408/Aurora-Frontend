import { render, screen } from '@/test-utils';
import { DataLoader } from '@/components/ui/DataLoader';

describe('DataLoader (accessible loading UX — never a bare spinner)', () => {
  it('spinner variant exposes status + copy', () => {
    render(<DataLoader label="Loading dashboard" />);
    const status = screen.getByRole('status', { name: 'Loading dashboard' });
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
  });

  it('skeleton renders N placeholders for layout stability (no CLS jump)', () => {
    const { container } = render(
      <DataLoader label="Loading" variant="skeleton" lines={4} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBe(4);
  });

  it('inline variant fits buttons / rows', () => {
    render(<DataLoader label="Saving" variant="inline" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
  });
});
