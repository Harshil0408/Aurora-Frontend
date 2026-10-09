import type { SellerStoreDetail, SellerSubscription } from '@/types/seller';
import { SELLER_INVITE_ACCEPT_PATH } from '@/lib/panels';

/** Days left on a trial (server UTC ISO `trialEnd`, computed client-side). */
export function trialDaysLeft(trialEnd: string | null | undefined, now = Date.now()): number | null {
  if (!trialEnd) return null;
  const end = Date.parse(trialEnd);
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now) / 86_400_000));
}

/** paise → INR display (₹499 for 49900). */
export function formatPricePaise(pricePaise: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(pricePaise / 100);
  } catch {
    return `${currency} ${(pricePaise / 100).toFixed(2)}`;
  }
}

export interface OnboardingItem {
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

/**
 * Onboarding checklist derived client-side (no dedicated endpoint).
 * Products / payments / shipping rows resolve once those APIs land —
 * for now they report `done: false` with an "upcoming" hint.
 */
export function onboardingChecklist(detail: SellerStoreDetail | null | undefined): OnboardingItem[] {
  return [
    {
      key: 'store',
      label: 'Store information',
      done: Boolean(detail?.name && detail?.country),
      hint: 'Name and country on the settings page',
    },
    {
      key: 'business',
      label: 'Business information',
      done: Boolean(detail?.contactEmail || detail?.contactPhone),
      hint: 'A contact email or phone buyers can reach',
    },
    {
      key: 'product',
      label: 'Add first product',
      done: false,
      hint: 'Products API is upcoming — this unlocks automatically then',
    },
    {
      key: 'team',
      label: 'Invite team members',
      done: (detail?.memberCount ?? 0) > 1,
      hint: 'Member count above one (or pending invitations)',
    },
    {
      key: 'plan',
      label: 'Choose plan / trial',
      done: detail?.subscription != null,
      hint: 'Every store starts on a 14-day Starter trial',
    },
  ];
}

export function trialBannerFor(
  subscription: SellerSubscription | null | undefined,
): { tone: 'info' | 'warn'; text: string } | null {
  if (!subscription) return null;
  if (subscription.status === 'TRIALING') {
    const left = trialDaysLeft(subscription.trialEnd);
    return {
      tone: 'info',
      text:
        left == null
          ? 'Your Starter trial is active.'
          : left === 0
            ? 'Your Starter trial ends today — pick a plan to stay active.'
            : `Your Starter trial ends in ${left} day${left === 1 ? '' : 's'} — pick a plan to stay active.`,
    };
  }
  if (subscription.status === 'PAST_DUE') {
    return { tone: 'warn', text: 'Payment is past due — update billing to avoid interruption.' };
  }
  return null;
}

/** Display label — the plan block can be absent (e.g. a bare trial row). */
export function subscriptionLabel(sub: SellerSubscription | null | undefined): string {
  if (!sub) return 'None';
  return sub.plan ? `${sub.plan.name} · ${sub.status}` : sub.status;
}

/** Copyable invite link — the raw token is returned once at creation. */
export function inviteAcceptLink(token: string): string {
  return `${SELLER_INVITE_ACCEPT_PATH}?token=${encodeURIComponent(token)}`;
}

/* ------------------------- invite join intent ------------------------- */

const INVITE_TOKEN_KEY = 'ecomm-seller-invite-token';

function sessionStore(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Stash the `?token=` across the login/register redirect. sessionStorage is
 * the right scope: it survives the redirect but dies with the tab, so join
 * intent never leaks across sessions (localStorage would).
 */
export function stashInviteToken(token: string): void {
  try {
    sessionStore()?.setItem(INVITE_TOKEN_KEY, token);
  } catch {}
}

/** Read the stashed token without clearing it. */
export function peekInviteToken(): string | null {
  try {
    return sessionStore()?.getItem(INVITE_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearInviteToken(): void {
  try {
    sessionStore()?.removeItem(INVITE_TOKEN_KEY);
  } catch {}
}

export type SellerLanding =
  | { kind: 'invitations' }
  | { kind: 'dashboard'; storeId: string }
  | { kind: 'create-store' };

/**
 * Post-auth destination — join intent beats everything. Never route to
 * create-store while invites are pending; the invite flow owns the user until
 * the stash is cleared and the inbox is empty.
 */
export function resolveSellerLanding(opts: {
  pendingCount: number;
  storeIds: string[];
  lastUsedStoreId: string | null;
}): SellerLanding {
  if (opts.pendingCount > 0) return { kind: 'invitations' };
  if (opts.storeIds.length > 0) {
    const target =
      opts.lastUsedStoreId && opts.storeIds.includes(opts.lastUsedStoreId)
        ? opts.lastUsedStoreId
        : opts.storeIds[0];
    return { kind: 'dashboard', storeId: target };
  }
  return { kind: 'create-store' };
}
