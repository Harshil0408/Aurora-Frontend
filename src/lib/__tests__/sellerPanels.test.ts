import {
  SELLER_CREATE_STORE_PATH,
  SELLER_INVITATIONS_PATH,
  SELLER_INVITE_ACCEPT_PATH,
  SELLER_LOGIN_PATH,
  SELLER_REGISTER_PATH,
  sellerDashboardPath,
  sellerStorePath,
} from '@/lib/panels';
import { isPublicRoute, isSellerRoute } from '@/lib/permissions';

describe('seller panel routes', () => {
  it('exposes stable seller paths', () => {
    expect(SELLER_LOGIN_PATH).toBe('/seller/login');
    expect(SELLER_REGISTER_PATH).toBe('/seller/register');
    expect(SELLER_CREATE_STORE_PATH).toBe('/seller/onboarding/create-store');
    expect(SELLER_INVITE_ACCEPT_PATH).toBe('/seller/invite/accept');
    expect(SELLER_INVITATIONS_PATH).toBe('/seller/invitations');
    expect(sellerStorePath('abc', 'team')).toBe('/seller/stores/abc/team');
    expect(sellerDashboardPath('abc')).toBe('/seller/stores/abc/dashboard');
  });

  it('detects seller routes and public seller pages', () => {
    expect(isSellerRoute('/seller/login')).toBe(true);
    expect(isSellerRoute('/seller/stores/abc/dashboard')).toBe(true);
    expect(isSellerRoute('/seller')).toBe(true);
    expect(isSellerRoute('/admin/dashboard')).toBe(false);
    expect(isPublicRoute('/seller/login')).toBe(true);
    expect(isPublicRoute('/seller/register')).toBe(true);
    expect(isPublicRoute('/seller/invite/accept')).toBe(true);
    // The inbox needs a session — it is seller-routed but not public.
    expect(isPublicRoute('/seller/invitations')).toBe(false);
    expect(isSellerRoute('/seller/invitations')).toBe(true);
    expect(isPublicRoute('/seller/stores')).toBe(false);
  });
});
