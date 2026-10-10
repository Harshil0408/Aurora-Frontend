import { mercatoTokens } from '@/lib/theme';

/**
 * Global static variables — preview constants per route until their APIs
 * land. Import from here instead of inlining statics in views.
 * (Route-interactive state and JSX content stay in the view files.)
 */

/* ------------------------------- /admins ------------------------------ */

export type AdminStatus = 'Active' | 'Suspended' | 'Disabled';

export interface SampleAdmin {
  email: string;
  name: string;
  status: AdminStatus;
  roles: string[];
  tfa: boolean;
  created: string;
  you?: boolean;
  lastSuperAdmin?: boolean;
}

/** Static preview rows — replace with the admins API later. */
export const ADMINS: SampleAdmin[] = [
  { email: 'aisha@mercato.com', name: 'Aisha Rahman', status: 'Active', roles: ['Super Admin'], tfa: true, created: 'Mar 2023', you: true },
  { email: 'marcus@mercato.com', name: 'Marcus Bell', status: 'Active', roles: ['Super Admin', 'Finance'], tfa: true, created: 'Jun 2023', lastSuperAdmin: true },
  { email: 'ines@mercato.com', name: 'Ines Duarte', status: 'Active', roles: ['Sub-Admin', 'Support'], tfa: false, created: 'Jan 2024' },
  { email: 'tomas@mercato.com', name: 'Tomás Rivera', status: 'Suspended', roles: ['Support'], tfa: true, created: 'Feb 2024' },
  { email: 'priya@mercato.com', name: 'Priya Nair', status: 'Disabled', roles: ['Finance'], tfa: false, created: 'Aug 2025' },
];

export const ALL_ROLES = ['Super Admin', 'Sub-Admin', 'Support', 'Finance'];
/** Signed-in viewer is a Super Admin (see topbar chip). Non-Super-Admins never see the SA grant. */
export const VIEWER_IS_SUPER_ADMIN = true;

/**
 * Status tones read live from `mercatoTokens` (getters, not a snapshot) so a
 * saved theme still applies after reload / preset switch.
 */
export const statusTone: Record<AdminStatus, { bg: string; color: string }> = {
  get Active() {
    return { bg: mercatoTokens.goodSoft, color: mercatoTokens.good };
  },
  get Suspended() {
    return { bg: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong };
  },
  get Disabled() {
    return { bg: mercatoTokens.badSoft, color: mercatoTokens.bad };
  },
};

export const tabs: Array<'All' | AdminStatus> = ['All', 'Active', 'Suspended', 'Disabled'];

export type DialogKind = null | 'create' | 'details' | 'status' | 'roles' | 'revoke';

/* ------------------------------- /roles ------------------------------- */
/* (Role/permission data is live from GET /admin/{roles,permissions} — see
   src/types/rbac.ts. No preview constants.) */

/* ------------------------------ /activity ----------------------------- */
/* (Activity-log data is live from GET /admin/activity{,/actions,/:id} — see
   src/types/activity.ts and src/services/activityApi.ts. The log is
   append-only; no preview constants.) */

/* ---------------------------- /attributes ----------------------------- */
/* Global lookup catalog — one table namespaced by `type`. The sidebar groups
   types into audience scopes; `general` pins the curated seller-catalog set. */

export type AttributeScope = 'admin' | 'seller' | 'user' | 'general';

export interface AttributeScopeMeta {
  scope: AttributeScope;
  label: string;
  blurb: string;
}

export const ATTRIBUTE_SCOPES: AttributeScopeMeta[] = [
  { scope: 'admin', label: 'Admin', blurb: 'Console-level lookups' },
  { scope: 'seller', label: 'Seller', blurb: 'Seller-facing lookups' },
  { scope: 'user', label: 'Users', blurb: 'Shopper-facing lookups' },
  { scope: 'general', label: 'General', blurb: 'Shared platform lookups' },
];

export interface GeneralAttributeType {
  type: string;
  label: string;
  hint: string;
}

/** Curated General catalog — each card links to its per-type list screen. */
export const GENERAL_ATTRIBUTE_TYPES: GeneralAttributeType[] = [
  { type: 'store_category', label: 'Store categories', hint: 'Seller store taxonomy' },
  { type: 'language', label: 'Languages', hint: 'Locale codes, e.g. en-US' },
  { type: 'payment_type', label: 'Payment types', hint: 'Checkout payment options' },
  { type: 'currency', label: 'Currencies', hint: 'Currency codes, e.g. INR' },
  { type: 'country', label: 'Countries', hint: 'Country codes, e.g. +91' },
  { type: 'timezone', label: 'Timezones', hint: 'IANA zones per store' },
];

/** Scope of a lookup type: curated General set first, then prefix convention. */
export function scopeOfAttributeType(type: string): AttributeScope {
  const t = type.trim().toLowerCase();
  if (GENERAL_ATTRIBUTE_TYPES.some((g) => g.type === t)) return 'general';
  if (t.startsWith('admin_')) return 'admin';
  if (t.startsWith('seller_')) return 'seller';
  if (t.startsWith('user_') || t.startsWith('shopper_') || t.startsWith('customer_')) return 'user';
  return 'admin';
}

/** Title-case display name for a snake_case lookup type. */
export function prettyAttributeType(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ------------------------- seller lookup selects ------------------------ */
/* Seller dropdowns read the shared catalog live (store_category, currency,
   country, timezone). No preset option lists live here — when the catalog
   is unreachable or a list is still empty, the UI shows a fallback message
   instead of fake data. */

export const LOOKUP_ATTRIBUTE_TYPES = {
  category: 'store_category',
  currency: 'currency',
  country: 'country',
  timezone: 'timezone',
} as const;

export type LookupField = keyof typeof LOOKUP_ATTRIBUTE_TYPES;

export interface LookupOption {
  value: string;
  label: string;
  /** Admin-configured payload (e.g. INR) shown as "Label (code)". */
  code?: string;
}

/**
 * Catalog rows → dropdown options. The stored value is the admin-configured
 * payload (`value`, e.g. INR / +91) falling back to the stable `key` slug;
 * the code suffix shows only when a payload exists.
 */
export function lookupOptionsFromAttributes(
  rows: Array<{ key: string; label: string; value: string | null }>,
): LookupOption[] {
  return rows.map((r) => ({
    value: r.value ?? r.key,
    label: r.label,
    code: r.value ?? undefined,
  }));
}

/** Display text for an option: "Indian Rupee (INR)" when a code exists. */
export function lookupOptionLabel(o: LookupOption): string {
  return o.code && o.code !== o.label ? `${o.label} (${o.code})` : o.label;
}
