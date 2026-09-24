import { render, screen, fireEvent } from '@/test-utils';
import { FallbackUI } from '@/components/ui/FallbackUI';

describe('FallbackUI', () => {
  it('renders title + description with status role by default', () => {
    render(<FallbackUI title="No orders" description="Nothing here yet" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No orders')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('uses alert role for error tone (screen-reader urgency)', () => {
    render(<FallbackUI title="Failed" tone="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders action button and fires handler', () => {
    const onAction = jest.fn();
    render(
      <FallbackUI title="Empty" actionLabel="Retry" onAction={onAction} />,
    );
    const btn = screen.getByRole('button', { name: 'Retry' });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('omits button when handler missing (no dead control)', () => {
    render(<FallbackUI title="Empty" actionLabel="Retry" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('locked tone keeps status role (not an error)', () => {
    render(<FallbackUI title="Locked" tone="locked" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
