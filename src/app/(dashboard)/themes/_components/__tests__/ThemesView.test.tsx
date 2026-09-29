import { render, screen, userEvent } from '@/test-utils';
import { ThemeManagerProvider } from '@/app/providers';
import { ThemesView } from '../ThemesView';

function renderView() {
  return render(
    <ThemeManagerProvider>
      <ThemesView />
    </ThemeManagerProvider>,
  );
}

describe('ThemesView', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders all presets with the active one marked', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
    for (const name of ['Aurora Violet', 'Indigo', 'Emerald', 'Deep Teal', 'Midnight Navy']) {
      expect(screen.getByLabelText(`${name} theme`)).toBeInTheDocument();
    }
    expect(screen.getByText(/Active: Aurora Violet/)).toBeInTheDocument();
  });

  it('applies a preset instantly and persists it', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: 'Use Emerald' }));
    expect(await screen.findByText(/Active: Emerald/)).toBeInTheDocument();
    expect(window.localStorage.getItem('aurora-theme-preset')).toBe('emerald');
    expect(screen.getByRole('button', { name: 'Currently active' })).toBeDisabled();
  });

  it('shows a live preview that follows the theme', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Live preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Primary action' })).toBeInTheDocument();
    expect(screen.getByLabelText('Sample field')).toBeInTheDocument();
  });
});
