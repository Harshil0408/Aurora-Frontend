/**
 * Seller domain types — mirror of backend contracts
 * (backend: `/api/v1/seller/*`, source of truth `src/docs/openapi.ts`).
 *
 * Auth: short-lived Bearer JWT (5 min) + rotating HttpOnly refresh cookie
 * (`seller_rt`). The selected store is never trusted client-side — every
 * store-scoped request carries `:storeId` and the backend re-validates.
 */

/* --------------------------------- auth --------------------------------- */

export interface SellerRegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SellerLoginRequest {
  email: string;
  password: string;
}

export interface SellerSessionPayload {
  user: {
    id: string;
    email: string;
    name: string;
    status: string;
  };
  accessToken: string;
  expiresInSeconds: number;
}

export interface SellerStoreMembership {
  storeId: string;
  storeName: string;
  slug: string;
  storeStatus: string;
  roleKey: string;
  roleName: string;
  joinedAt: string;
}

export interface SellerMeResponse {
  id: string;
  email: string;
  name: string;
  status: string;
  createdAt: string;
  stores: SellerStoreMembership[];
}

export interface SellerSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
}

/* --------------------------------- stores -------------------------------- */

export interface SellerStoreSummary {
  storeId: string;
  name: string;
  slug: string;
  status: string;
  roleKey: string;
  roleName: string;
  memberCount: number;
  subscription: SellerSubscription | null;
  joinedAt: string;
}

export interface CreateStoreRequest {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  contactEmail?: string;
  contactPhone?: string;
  logo?: string;
}

export interface SellerStoreDetail {
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  country: string | null;
  currency: string;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
  logo: string | null;
  status: string;
  onboardingCompletedAt: string | null;
  memberCount: number;
  subscription: SellerSubscription | null;
  roleKey: string;
  roleName: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SwitchStoreResponse {
  storeId: string;
  name: string;
  slug: string;
  status: string;
  roleKey: string;
  permissions: string[];
  subscription: SellerSubscription | null;
}

/* ------------------------------- team & roles ---------------------------- */

export interface SellerMember {
  membershipId: string;
  userId: string;
  email: string;
  name: string;
  roleKey: string;
  roleName: string;
  status: string;
  joinedAt: string;
}

export interface SellerInvitation {
  id: string;
  email: string;
  roleKey: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

/**
 * Invitee inbox row (`GET /seller/team/invitations/pending`) — matched by
 * logged-in email for invitees who arrive without the link. Carries no token
 * (only the hash is stored server-side), so inbox accepts go by id.
 */
export interface PendingInvitation {
  id: string;
  storeId: string;
  storeName: string;
  slug: string;
  roleKey: string;
  roleName: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationResponse {
  invitationId: string;
  email: string;
  roleKey: string;
  expiresAt: string;
  /** Raw token — returned once. Build the copyable invite link from it. */
  token: string;
}

export interface SellerRole {
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  status: string;
  memberCount: number;
  permissions: string[];
}

export interface SellerPermissionGroup {
  resource: string;
  permissions: Array<{ key: string; label: string; description: string }>;
}

/* --------------------------------- billing -------------------------------- */

export interface SellerPlan {
  key: string;
  name: string;
  description: string;
  pricePaise: number;
  currency: string;
  billingCycle: string;
  limits: Record<string, number>;
  trialDays: number;
  isActive: boolean;
}

export interface SellerSubscription {
  id: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';
  billingCycle: string;
  plan: {
    key: string;
    name: string;
    pricePaise: number;
    currency: string;
    limits: Record<string, number>;
  } | null;
  trialStart: string | null;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
}

/* --------------------------------- activity ------------------------------- */

export interface SellerAuditRow {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

/** Permission catalog for the `can()` helper (owner set contains all 27). */
export const SELLER_PERMISSIONS = [
  'store:read',
  'store:update',
  'store:delete',
  'store:transfer',
  'product:create',
  'product:read',
  'product:update',
  'product:delete',
  'order:read',
  'order:update',
  'order:cancel',
  'inventory:read',
  'inventory:update',
  'customer:read',
  'customer:update',
  'analytics:read',
  'staff:invite',
  'staff:remove',
  'staff:update',
  'role:read',
  'role:create',
  'role:update',
  'role:delete',
  'settings:read',
  'settings:update',
  'billing:read',
  'billing:update',
] as const;

export type SellerPermission = (typeof SELLER_PERMISSIONS)[number];
