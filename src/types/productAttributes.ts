/** Module 4 — product attributes, options and attribute sets. */

export type ProductAttributeStatus = "ACTIVE" | "INACTIVE";
export type ProductAttributeOptionStatus = "SUGGESTED" | "ACTIVE" | "DISABLED";

export const PRODUCT_ATTRIBUTE_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DECIMAL",
  "BOOLEAN",
  "DROPDOWN",
  "MULTI_SELECT",
  "COLOR_SWATCH",
  "IMAGE_SWATCH",
  "DATE",
] as const;

export type ProductAttributeType = (typeof PRODUCT_ATTRIBUTE_TYPES)[number];

/** Types whose values come from an option catalog. */
export const OPTION_KEYED_TYPES: ProductAttributeType[] = [
  "DROPDOWN",
  "MULTI_SELECT",
  "COLOR_SWATCH",
  "IMAGE_SWATCH",
];

export function isOptionKeyed(type: ProductAttributeType): boolean {
  return OPTION_KEYED_TYPES.includes(type);
}

export function attributeTypeLabel(type: ProductAttributeType): string {
  switch (type) {
    case "TEXT":
      return "Short text";
    case "TEXTAREA":
      return "Long text";
    case "NUMBER":
      return "Number";
    case "DECIMAL":
      return "Decimal";
    case "BOOLEAN":
      return "Yes / No";
    case "DROPDOWN":
      return "Dropdown";
    case "MULTI_SELECT":
      return "Multi-select";
    case "COLOR_SWATCH":
      return "Colour swatch";
    case "IMAGE_SWATCH":
      return "Image swatch";
    case "DATE":
      return "Date";
  }
}

/* ---------- admin: attributes + options ---------- */

export interface ProductAttributeOption {
  id: string;
  attributeId: string;
  label: string;
  value: string;
  swatchHex: string | null;
  imageUrl: string | null;
  displayOrder: number;
  status: ProductAttributeOptionStatus;
  suggestedByStoreId: string | null;
  suggestedBySellerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeCounts {
  options: number;
  items: number;
}

export interface ProductAttribute {
  id: string;
  name: string;
  code: string;
  type: ProductAttributeType;
  unit: string | null;
  helpText: string | null;
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  comparable: boolean;
  variantDefining: boolean;
  visibleOnPage: boolean;
  validationMin: number | null;
  validationMax: number | null;
  validationRegex: string | null;
  allowedUnits: string[];
  status: ProductAttributeStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: ProductAttributeCounts;
}

export interface ProductAttributeDetail extends ProductAttribute {
  options: ProductAttributeOption[];
  items: ProductAttributeSetItem[];
}

export interface CreateProductAttributeOption {
  label: string;
  value: string;
  swatchHex?: string;
  imageUrl?: string;
  displayOrder?: number;
}

export interface CreateProductAttributeRequest {
  name: string;
  code?: string;
  type: ProductAttributeType;
  unit?: string;
  helpText?: string;
  required?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  comparable?: boolean;
  variantDefining?: boolean;
  visibleOnPage?: boolean;
  validationMin?: number | null;
  validationMax?: number | null;
  validationRegex?: string | null;
  allowedUnits?: string[];
  options?: CreateProductAttributeOption[];
}

export type UpdateProductAttributeRequest = Partial<
  Omit<CreateProductAttributeRequest, "code" | "options">
>;

export interface UpdateProductAttributeOptionRequest {
  label?: string;
  value?: string;
  swatchHex?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  status?: ProductAttributeOptionStatus;
}

export interface ReorderRequest {
  orders: { id: string; displayOrder: number }[];
}

/* ---------- admin: suggestion queue ---------- */

export interface OptionSuggestionItem extends ProductAttributeOption {
  attribute: {
    id: string;
    name: string;
    code: string;
    type: ProductAttributeType;
  };
}

export interface ReviewSuggestionRequest {
  decision: "APPROVED" | "REJECTED";
  reviewNote?: string;
}

/* ---------- admin: attribute sets ---------- */

export interface ProductAttributeGroup {
  id: string;
  attributeSetId: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttributeSet {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductAttributeStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number; groups: number; categories: number };
}

export interface ProductAttributeSetItem {
  id: string;
  attributeSetId: string;
  attributeId: string;
  groupId: string | null;
  required: boolean | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  attribute?: ProductAttributeSummary;
  group?: { id: string; name: string; displayOrder: number } | null;
}

export interface ProductAttributeSummary {
  id: string;
  name: string;
  code: string;
  type: ProductAttributeType;
  unit: string | null;
  required: boolean;
  status: ProductAttributeStatus;
  _count?: { options: number };
}

export interface ProductAttributeSetDetail extends ProductAttributeSet {
  items: ProductAttributeSetItem[];
  groups: ProductAttributeGroup[];
  categories: { id: string; name: string; slug: string; status: string }[];
}

export interface CreateAttributeSetRequest {
  name: string;
  slug?: string;
  description?: string;
}

export type UpdateAttributeSetRequest = Partial<
  Omit<CreateAttributeSetRequest, "slug">
> & {
  slug?: string;
};

export interface CloneAttributeSetRequest {
  name?: string;
  slug?: string;
}

export interface AttachItemRequest {
  attributeId: string;
  groupId?: string | null;
  required?: boolean | null;
  displayOrder?: number;
}

export interface UpdateItemRequest {
  groupId?: string | null;
  required?: boolean | null;
  displayOrder?: number;
}

export interface CreateGroupRequest {
  name: string;
  displayOrder?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  displayOrder?: number;
}

/* ---------- seller ---------- */

export interface SellerResolvedAttributeSet {
  resolvedFrom: "category" | "inherited";
  categoryId: string | null;
  set: ProductAttributeSetDetail | null;
}

export interface SuggestOptionRequest {
  value: string;
  label?: string;
  swatchHex?: string;
  imageUrl?: string;
}
