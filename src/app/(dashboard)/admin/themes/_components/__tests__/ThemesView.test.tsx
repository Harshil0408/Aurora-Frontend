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

  it('renders all presets with the active one marked onyx', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeInTheDocument();
    for (const name of ['Onyx Console', 'Studio Indigo', 'Minimal Slate', 'Corporate Blue', 'Emerald', 'Startup Rose']) {
      if (name === 'Onyx Console') {
        expect(screen.getByLabelText(`Active theme: ${name}`)).toBeInTheDocument();
      } else {
        expect(screen.getByLabelText(`${name} theme`)).toBeInTheDocument();
      }
    }
    expect(screen.getByText(/Active: Onyx Console/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Midnight Navy theme')).not.toBeInTheDocument();
  });

  it('applies a preset instantly and persists it', async () => {
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole('button', { name: 'Use Emerald' }));
    expect(await screen.findByText(/Active: Emerald/)).toBeInTheDocument();
    expect(window.localStorage.getItem('aurora-theme-preset')).toBe('emerald');
  });

  it('toggles light/dark mode from the segmented control and persists it', async () => {
    const user = userEvent.setup();
    renderView();
    expect(screen.getByText(/Dark/)).toBeTruthy();
    expect(window.localStorage.getItem('aurora-theme-mode')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(window.localStorage.getItem('aurora-theme-mode')).toBe('light');
    // each preset card re-renders its mode swatches without errors
    expect(screen.getByLabelText('Active theme: Onyx Console')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(window.localStorage.getItem('aurora-theme-mode')).toBe('dark');
  });

  it('shows a live preview that follows the theme', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Live preview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Primary action' })).toBeInTheDocument();
    expect(screen.getByLabelText('Sample field')).toBeInTheDocument();
  });
});
