import { render, screen } from '@/test-utils';
import { ButtonLoader, PageLoader } from '@/components/ui/Loaders';

describe('Loaders', () => {
  it('PageLoader announces politely with default label', () => {
    render(<PageLoader />);
    const s = screen.getByRole('status');
    expect(s).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/Preparing your workspace/i)).toBeInTheDocument();
  });

  it('PageLoader honours custom label', () => {
    render(<PageLoader label="Redirecting to sign in" />);
    expect(
      screen.getByRole('status', { name: 'Redirecting to sign in' }),
    ).toBeInTheDocument();
  });

  it('ButtonLoader exposes accessible label', () => {
    render(<ButtonLoader label="Signing in" />);
    expect(screen.getByLabelText('Signing in')).toBeInTheDocument();
  });
});
