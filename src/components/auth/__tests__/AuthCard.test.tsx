import { render, screen } from '@/test-utils';
import { AuthCard } from '@/components/auth/AuthCard';

describe('AuthCard', () => {
  it('renders eyebrow/title/description + children in main landmark', () => {
    render(
      <AuthCard eyebrow="Sign in" title="Welcome" description="Desc here">
        <button>child-btn</button>
      </AuthCard>,
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
    expect(screen.getByText('Desc here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'child-btn' })).toBeInTheDocument();
  });
});
