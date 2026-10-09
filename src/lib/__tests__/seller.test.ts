import {
  clearInviteToken,
  formatPricePaise,
  inviteAcceptLink,
  onboardingChecklist,
  peekInviteToken,
  resolveSellerLanding,
  stashInviteToken,
  subscriptionLabel,
  trialBannerFor,
  trialDaysLeft,
} from '@/lib/seller';
import type { SellerStoreDetail } from '@/types/seller';

function detail(overrides: Partial<SellerStoreDetail> = {}): SellerStoreDetail {
  return {
    storeId: 'store-1',
    name: 'Aurora Fashion',
    slug: 'aurora-fashion-x1y2',
    description: null,
    category: 'Fashion',
    country: 'India',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    contactEmail: 'owner@shop.com',
    contactPhone: null,
    logo: null,
    status: 'ACTIVE',
    onboardingCompletedAt: null,
    memberCount: 1,
    subscription: null,
    roleKey: 'owner',
    roleName: 'Owner',
    permissions: ['store:read', 'store:update'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('trialDaysLeft', () => {
  it('computes whole days left and clamps past trials to zero', () => {
    expect(trialDaysLeft('2026-02-01T00:00:00.000Z', Date.parse('2026-01-30T00:00:00.000Z'))).toBe(2);
    expect(trialDaysLeft('2026-01-01T00:00:00.000Z', Date.parse('2026-02-01T00:00:00.000Z'))).toBe(0);
  });

  it('returns null for missing or invalid input', () => {
    expect(trialDaysLeft(null)).toBeNull();
    expect(trialDaysLeft(undefined)).toBeNull();
    expect(trialDaysLeft('not-a-date')).toBeNull();
  });
});

describe('formatPricePaise', () => {
  it('formats paise as INR', () => {
    expect(formatPricePaise(49900)).toContain('499');
    expect(formatPricePaise(0)).toContain('0');
  });
});

describe('onboardingChecklist', () => {
  it('derives each box from the store detail', () => {
    const items = Object.fromEntries(onboardingChecklist(detail()).map((i) => [i.key, i.done]));
    expect(items.store).toBe(true);
    expect(items.business).toBe(true);
    expect(items.product).toBe(false);
    expect(items.team).toBe(false);
    expect(items.plan).toBe(false);
  });

  it('marks team and plan done when members and subscription exist', () => {
    const items = Object.fromEntries(
      onboardingChecklist(
        detail({
          memberCount: 2,
          subscription: {
            id: 'sub-1',
            status: 'TRIALING',
            billingCycle: 'monthly',
            plan: { key: 'starter', name: 'Starter', pricePaise: 49900, currency: 'INR', limits: {} },
            trialStart: null,
            trialEnd: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
          },
        }),
      ).map((i) => [i.key, i.done]),
    );
    expect(items.team).toBe(true);
    expect(items.plan).toBe(true);
  });
});

describe('trialBannerFor', () => {
  it('counts down TRIALING and flags PAST_DUE, silent otherwise', () => {
    expect(trialBannerFor(null)).toBeNull();
    expect(
      trialBannerFor({
        id: 's',
        status: 'ACTIVE',
        billingCycle: 'monthly',
        plan: { key: 'starter', name: 'Starter', pricePaise: 49900, currency: 'INR', limits: {} },
        trialStart: null,
        trialEnd: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      }),
    ).toBeNull();
    const trial = trialBannerFor({
      id: 's',
      status: 'TRIALING',
      billingCycle: 'monthly',
      plan: { key: 'starter', name: 'Starter', pricePaise: 49900, currency: 'INR', limits: {} },
      trialStart: null,
      trialEnd: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
    expect(trial?.tone).toBe('info');
    expect(trial?.text).toContain('3 day');
    const pastDue = trialBannerFor({
      id: 's',
      status: 'PAST_DUE',
      billingCycle: 'monthly',
      plan: { key: 'starter', name: 'Starter', pricePaise: 49900, currency: 'INR', limits: {} },
      trialStart: null,
      trialEnd: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
    expect(pastDue?.tone).toBe('warn');
  });
});

describe('subscriptionLabel', () => {
  const planned = {
    id: 's',
    status: 'TRIALING' as const,
    billingCycle: 'monthly',
    plan: { key: 'starter', name: 'Starter', pricePaise: 49900, currency: 'INR', limits: {} },
    trialStart: null,
    trialEnd: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
  };
  it('names the plan when present and degrades gracefully without one', () => {
    expect(subscriptionLabel(planned)).toBe('Starter · TRIALING');
    expect(subscriptionLabel({ ...planned, plan: null })).toBe('TRIALING');
    expect(subscriptionLabel(null)).toBe('None');
    expect(subscriptionLabel(undefined)).toBe('None');
  });
});

describe('invite token stash (sessionStorage scope)', () => {
  it('stashes, peeks, and clears join intent', () => {
    expect(peekInviteToken()).toBeNull();
    stashInviteToken('tok-123');
    expect(peekInviteToken()).toBe('tok-123');
    clearInviteToken();
    expect(peekInviteToken()).toBeNull();
  });
});

describe('resolveSellerLanding (join intent beats everything)', () => {
  it('routes to the inbox while invites are pending — even with stores', () => {
    expect(
      resolveSellerLanding({ pendingCount: 2, storeIds: ['a'], lastUsedStoreId: 'a' }),
    ).toEqual({ kind: 'invitations' });
  });

  it('prefers the last-used store when it is still a membership', () => {
    expect(
      resolveSellerLanding({ pendingCount: 0, storeIds: ['a', 'b'], lastUsedStoreId: 'b' }),
    ).toEqual({ kind: 'dashboard', storeId: 'b' });
  });

  it('falls back to the first store when the preference is stale', () => {
    expect(
      resolveSellerLanding({ pendingCount: 0, storeIds: ['a', 'b'], lastUsedStoreId: 'gone' }),
    ).toEqual({ kind: 'dashboard', storeId: 'a' });
  });

  it('sends brand-new accounts with nothing pending to create-store', () => {
    expect(
      resolveSellerLanding({ pendingCount: 0, storeIds: [], lastUsedStoreId: null }),
    ).toEqual({ kind: 'create-store' });
  });
});

describe('inviteAcceptLink', () => {
  it('builds the accept URL with an encoded token', () => {
    expect(inviteAcceptLink('abc 123')).toBe('/seller/invite/accept?token=abc%20123');
  });
});
