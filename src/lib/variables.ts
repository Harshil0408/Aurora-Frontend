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

export const statusTone: Record<AdminStatus, { bg: string; color: string }> = {
  Active: { bg: mercatoTokens.goodSoft, color: mercatoTokens.good },
  Suspended: { bg: mercatoTokens.accentSoft, color: mercatoTokens.accentStrong },
  Disabled: { bg: mercatoTokens.badSoft, color: mercatoTokens.bad },
};

export const tabs: Array<'All' | AdminStatus> = ['All', 'Active', 'Suspended', 'Disabled'];

export type DialogKind = null | 'create' | 'details' | 'status' | 'roles' | 'revoke';

/* ------------------------------- /roles ------------------------------- */

export interface Role {
  key: string;
  name: string;
  description: string;
  system?: boolean;
}

export interface PermGroup {
  group: string;
  perms: Array<{ key: string; label: string; hint: string }>;
}

export const PERM_GROUPS: PermGroup[] = [
  {
    group: 'Admins',
    perms: [
      { key: 'admins.view', label: 'View', hint: 'List and inspect admin accounts' },
      { key: 'admins.create', label: 'Create', hint: 'Invite new admin accounts' },
      { key: 'admins.edit', label: 'Edit', hint: 'Change status and details' },
      { key: 'admins.suspend', label: 'Suspend', hint: 'Suspend or disable accounts' },
    ],
  },
  {
    group: 'Roles',
    perms: [
      { key: 'roles.view', label: 'View', hint: 'List roles and permissions' },
      { key: 'roles.create', label: 'Create', hint: 'Create new custom roles' },
      { key: 'roles.edit', label: 'Edit', hint: 'Change permissions of a role' },
      { key: 'roles.assign', label: 'Assign', hint: 'Grant or remove roles on admins' },
    ],
  },
  {
    group: 'Activity',
    perms: [
      { key: 'activity.view', label: 'View', hint: 'Read the activity log' },
      { key: 'activity.export', label: 'Export', hint: 'Download log excerpts' },
    ],
  },
  {
    group: 'Sessions',
    perms: [
      { key: 'sessions.view', label: 'View', hint: 'List active admin sessions' },
      { key: 'sessions.revoke', label: 'Revoke', hint: 'Revoke one or all sessions' },
    ],
  },
];

export const INITIAL_ROLES: Role[] = [
  {
    key: 'super-admin',
    name: 'Super Admin',
    description: 'Full access, including role grants and admin suspension.',
    system: true,
  },
  {
    key: 'sub-admin',
    name: 'Sub-Admin',
    description: 'Manage sellers, products and orders. Cannot touch roles.',
    system: true,
  },
  {
    key: 'support',
    name: 'Support',
    description: 'Read-only access plus refunds and ticket replies.',
    system: true,
  },
  {
    key: 'finance',
    name: 'Finance',
    description: 'Payouts, commissions and subscriptions.',
    system: false,
  },
];

export const INITIAL_GRANTS: Record<string, string[]> = {
  'super-admin': PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.key)),
  'sub-admin': ['admins.view', 'activity.view', 'sessions.view'],
  support: ['activity.view'],
  finance: ['activity.view', 'activity.export', 'sessions.view'],
};

/* ------------------------------ /activity ----------------------------- */

export interface LogEntry {
  id: number;
  timestamp: string;
  action: string;
  actionType: string;
  resource: string;
  actor: string;
  ip: string;
  changes: Array<{ field: string; before: string; after: string }>;
}

/** Static preview rows — replace with the activity API later. */
export const LOGS: LogEntry[] = [
  {
    id: 1, timestamp: 'Sep 21, 2026 · 14:02', action: 'Roles assigned', actionType: 'Roles assigned',
    resource: 'ines@mercato.com', actor: 'aisha@mercato.com', ip: '84.121.9.40',
    changes: [{ field: 'roles', before: 'Sub-Admin', after: 'Sub-Admin, Support' }],
  },
  {
    id: 2, timestamp: 'Sep 20, 2026 · 18:44', action: 'Status changed', actionType: 'Status changed',
    resource: 'tomas@mercato.com', actor: 'marcus@mercato.com', ip: '84.121.9.41',
    changes: [{ field: 'status', before: 'Active', after: 'Suspended' }, { field: 'reason', before: '—', after: 'Failed KYC re-check' }],
  },
  {
    id: 3, timestamp: 'Sep 19, 2026 · 09:15', action: 'Role created', actionType: 'Role created',
    resource: 'finance', actor: 'aisha@mercato.com', ip: '84.121.9.40',
    changes: [{ field: 'permissions', before: '—', after: '0 (assign now)' }],
  },
  {
    id: 4, timestamp: 'Sep 18, 2026 · 11:30', action: 'Admin created', actionType: 'Admin created',
    resource: 'priya@mercato.com', actor: 'aisha@mercato.com', ip: '84.121.9.40',
    changes: [{ field: 'permissions', before: '—', after: 'Finance' }],
  },
  {
    id: 5, timestamp: 'Sep 17, 2026 · 16:05', action: 'Role updated', actionType: 'Role updated',
    resource: 'support', actor: 'marcus@mercato.com', ip: '84.121.9.41',
    changes: [{ field: 'sessions.revoke', before: 'denied', after: 'allowed' }],
  },
];

export const ACTION_TYPES = ['All actions', 'Admin created', 'Status changed', 'Roles assigned', 'Role created', 'Role updated'];
