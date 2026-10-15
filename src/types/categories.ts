/**
 * Product category tree — mirror of backend contracts
 * (backend: `/api/v1/admin/categories*` + `/api/v1/seller/catalog/:storeId/categories*`,
 * source of truth `src/docs/openapi.ts` in e-comm-backend).
 *
 * Admin-owned, seller-consumed. Products attach to leaves only (Module 6).
 * Retired slugs stay reserved as redirects — the picker resolves leaves by id.
 */

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CategoryAccess = 'open' | 'restricted' | 'pending' | 'granted';

export interface CategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  icon: string | null;
  displayOrder: number;
  status: CategoryStatus;
  showInNav: boolean;
  showOnHomepage: boolean;
  restricted: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  /** Forward placeholders (Modules 4/5/29) — null until those land. */
  attributeSetId: string | null;
  taxClassId: string | null;
  commissionRateBps: number | null;
  returnWindowDays: number | null;
  childCount: number;
  leaf: boolean;
  breadcrumb: string;
  children?: CategoryNode[];
}

export interface SellerCategoryNode extends CategoryNode {
  access: CategoryAccess;
  children?: SellerCategoryNode[];
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  icon?: string;
  displayOrder?: number;
  showInNav?: boolean;
  showOnHomepage?: boolean;
  restricted?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  attributeSetId?: string | null;
  taxClassId?: string | null;
  commissionRateBps?: number | null;
  returnWindowDays?: number | null;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface ListCategoriesArgs {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
  parentId?: string;
  rootOnly?: boolean;
  includeDeleted?: boolean;
}

export interface ImportPreview {
  creates: number;
  updates: number;
  errors: Array<{ row: number; message: string }>;
  committed: boolean;
}

export interface CategoryRequestRow {
  id: string;
  storeId: string;
  name: string;
  justification: string;
  proposedParentId: string | null;
  proposedParent: { id: string; name: string; slug: string } | null;
  status: ApprovalStatus;
  reviewNote: string | null;
  resolvedCategoryId: string | null;
  decidedAt: string | null;
  createdAt: string;
  store?: { id: string; name: string; slug: string };
}

export interface CategoryAccessRow {
  id: string;
  storeId: string;
  categoryId: string;
  documentAssetIds: string[];
  status: ApprovalStatus;
  reviewNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  store?: { id: string; name: string; slug: string };
}
