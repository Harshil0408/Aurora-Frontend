/** Global lookup-catalog (attributes) wire types — one table, namespaced by `type`. */

export type AttributeStatus = 'ACTIVE' | 'INACTIVE';

export interface Attribute {
  id: string;
  type: string;
  key: string;
  label: string;
  value: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  sortOrder: number;
  status: AttributeStatus;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeTypeRow {
  type: string;
  count: number;
}

export type AttributeStatusFilter = 'ALL' | AttributeStatus;

export interface ListAttributesArgs {
  page?: number;
  limit?: number;
  type?: string;
  status?: AttributeStatus;
  search?: string;
}

export interface CreateAttributeRequest {
  type: string;
  key: string;
  label: string;
  value?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
}

export interface UpdateAttributeRequest {
  label?: string;
  /** `null` clears the field. Omit to leave unchanged. */
  value?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  sortOrder?: number;
}

export interface SetAttributeStatusRequest {
  status: AttributeStatus;
  reason: string;
}

export const ATTRIBUTE_STATUS_LABEL: Record<AttributeStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const ATTRIBUTE_TYPE_RE = /^[a-z][a-z0-9_]*$/;
export const ATTRIBUTE_KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** `Fashion & Apparel` → `fashion-apparel` (mirrors the backend slug hint). */
export function slugifyAttributeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
