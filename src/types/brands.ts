export type BrandStatus = 'ACTIVE' | 'INACTIVE';
export type ApprovalState = 'PENDING' | 'APPROVED' | 'REJECTED';

/* ---------- admin ---------- */

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
  status: BrandStatus;
  restricted: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDetail extends Brand {
  redirects: { id: string; slug: string; createdAt: string }[];
  requests: {
    id: string;
    status: ApprovalState;
    store: { id: string; name: string; slug: string };
    resolvedBrand: { id: string; name: string; slug: string } | null;
    createdAt: string;
  }[];
}

export interface CreateBrandRequest {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  website?: string;
  country?: string;
  featured?: boolean;
  restricted?: boolean;
}

export type UpdateBrandRequest = Partial<CreateBrandRequest>;

export interface MergeBrandResponse {
  id: string;
  mergedIntoId: string | null;
}

export interface BrandImportRow {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  country?: string;
  status?: BrandStatus;
  restricted?: boolean;
  featured?: boolean;
}

export interface BrandImportPreview {
  headers: string[];
  rowTotal: number;
  brandCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
}

export interface BrandImportCommit {
  createdCount: number;
  skippedCount: number;
}

export interface AdminBrandRequestItem {
  id: string;
  storeId: string;
  store: { id: string; name: string; slug: string };
  sellerId: string | null;
  name: string;
  website: string | null;
  proofAssetIds: string[];
  justification: string;
  status: ApprovalState;
  reviewNote: string | null;
  resolvedBrandId: string | null;
  resolvedBrand: { id: string; name: string; slug: string } | null;
  reviewedById: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface AdminAuthQueueItem {
  id: string;
  brandId: string;
  brand: { id: string; name: string; slug: string; restricted: boolean };
  storeId: string;
  store: { id: string; name: string; slug: string };
  documentAssetIds: string[];
  status: ApprovalState;
  reviewNote: string | null;
  expiresAt: string | null;
  reviewedById: string | null;
  decidedAt: string | null;
  createdAt: string;
}

/* ---------- request/queue payloads ---------- */

export interface ReviewBrandRequest {
  decision: ApprovalState;
  reviewNote?: string;
  resolvedBrandId?: string | null;
}

export interface ReviewBrandAuthorisation {
  decision: ApprovalState;
  reviewNote?: string;
  expiresAt?: string | null;
}

/* ---------- seller ---------- */

export type BrandAccessState = 'open' | 'restricted' | 'pending' | 'granted' | 'expired';

export interface SellerBrandRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  country: string | null;
  restricted: boolean;
  access: BrandAccessState;
  authorisationExpiresAt: string | null;
}

export interface SellerBrandRequest {
  id: string;
  name: string;
  website: string | null;
  proofAssetIds: string[];
  justification: string;
  status: ApprovalState;
  reviewNote: string | null;
  resolvedBrandId: string | null;
  resolvedBrand: { id: string; name: string; slug: string } | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface SellerAuthorisation {
  id: string;
  brandId: string;
  brand: { id: string; name: string; slug: string };
  documentAssetIds: string[];
  status: ApprovalState;
  reviewNote: string | null;
  expiresAt: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface CreateSellerBrandRequest {
  name: string;
  website?: string;
  justification: string;
  proofAssetIds?: string[];
  logoUrl?: string;
}

export interface ApplySellerAuthorisation {
  documentAssetIds: string[];
  note?: string;
  expiresAt?: string;
}
