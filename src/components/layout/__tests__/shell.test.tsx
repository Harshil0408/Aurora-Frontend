import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { AppShell } from '../AppShell';
import { SIDEBAR_WIDTH } from '../Sidebar';

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/admins',
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => null,
}));

// Render the desktop (flush) sidebar instead of the closed mobile drawer.
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => true,
}));

// Sidebar gates Administration items on permissions — simulate a Super Admin.
jest.mock('@/services/rbacApi', () => ({
  useMyPermissionsQuery: () => ({
    data: { success: true, data: { permissions: ['admin.read', 'role.read', 'audit.read', 'attribute.read'] } },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

function renderShell() {
  return renderWithProviders(
    <AppShell>
      <p>Page body</p>
    </AppShell>,
  );
}

describe('AppShell layout', () => {
  it('keeps the sidebar roomy yet flush to the viewport edge', () => {
    expect(SIDEBAR_WIDTH).toBeGreaterThanOrEqual(264);
    expect(SIDEBAR_WIDTH).toBeLessThanOrEqual(288);
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
    // Active section is announced for screen readers / scoping.
    expect(screen.getByRole('link', { name: 'Admins' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Page body')).toBeInTheDocument();
    expect(screen.getByText('Skip to content')).toBeInTheDocument();
  });

  it('topbar shows the current section, search, and status', () => {
    renderShell();
    expect(screen.getByTestId('topbar-title')).toHaveTextContent('Admins');
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByLabelText('All systems live')).toBeInTheDocument();
  });

  it('notifications open with an unread count that clears on read', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: 'Notifications, 3 unread' }));
    expect(await screen.findByRole('menuitem', { name: /Maple & Moss Candles/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark all read' }));
    // Read action applies immediately inside the still-open menu…
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull();
    // …and the bell reports everything read once the menu is dismissed.
    await user.click(screen.getByRole('menuitem', { name: /Maple & Moss Candles/ }));
    expect(await screen.findByRole('button', { name: 'Notifications, all read' })).toBeInTheDocument();
  });

  it('profile menu exposes security settings and both sign-out paths', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole('button', { name: /Account menu for/ }));
    // MUI keeps role="menuitem" even when the item renders as a link.
    expect(await screen.findByRole('menuitem', { name: 'Security settings' })).toHaveAttribute('href', '/admin/security');
    expect(screen.getByRole('menuitem', { name: 'Sign out this session' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sign out everywhere' })).toBeInTheDocument();
  });

  it('attributes accordion nests admin, seller, users, and general lookups', async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole('button', { name: 'Attributes' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('list', { name: 'Attributes subsections' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All types' })).toHaveAttribute('href', '/admin/attributes');
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/attributes?scope=admin');
    expect(screen.getByRole('link', { name: 'Seller' })).toHaveAttribute('href', '/admin/attributes?scope=seller');
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/attributes?scope=user');
    expect(screen.getByRole('link', { name: 'General' })).toHaveAttribute('href', '/admin/attributes/general');
  });
});
