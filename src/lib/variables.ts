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
