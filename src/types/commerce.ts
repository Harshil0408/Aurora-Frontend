/** Module 5 — tax classes, HSN/SAC codes, units of measure, commerce settings. */

export type TaxClassStatus = "ACTIVE" | "INACTIVE";

export const TAX_CLASS_STATUSES: TaxClassStatus[] = ["ACTIVE", "INACTIVE"];

export function taxClassStatusLabel(status: TaxClassStatus): string {
  return status === "ACTIVE" ? "Active" : "Inactive";
}

export type UnitDimension = "MASS" | "LENGTH" | "VOLUME" | "QUANTITY";

export const UNIT_DIMENSIONS: UnitDimension[] = [
  "MASS",
  "LENGTH",
  "VOLUME",
  "QUANTITY",
];

export function unitDimensionLabel(dimension: UnitDimension): string {
  switch (dimension) {
    case "MASS":
      return "Mass";
    case "LENGTH":
      return "Length";
    case "VOLUME":
      return "Volume";
    case "QUANTITY":
      return "Quantity";
  }
}

export type RoundingMode = "NONE" | "ROUND_HALF_UP" | "ROUND_UP_TO_RUPEE";

export const ROUNDING_MODES: RoundingMode[] = [
  "NONE",
  "ROUND_HALF_UP",
  "ROUND_UP_TO_RUPEE",
];

export function roundingModeLabel(mode: RoundingMode): string {
  switch (mode) {
    case "NONE":
      return "None (keep paise)";
    case "ROUND_HALF_UP":
      return "Round half up";
    case "ROUND_UP_TO_RUPEE":
      return "Round up to rupee";
  }
}

export type TaxComponent = "CGST" | "SGST" | "IGST" | "CESS";

export const GST_COMPONENT_LABEL: Record<TaxComponent, string> = {
  CGST: "CGST (state share)",
  SGST: "SGST (state share)",
  IGST: "IGST (inter-state)",
  CESS: "Cess",
};

export type QuoteRounding = "none" | "half-up" | "rup";

/* ---------- tax classes ---------- */

/** NOTE: `ratePercent`, `cessPercent` are Prisma Decimals — serialized as strings. */
export interface TaxRate {
  id: string;
  taxClassId: string;
  region: string;
  ratePercent: string;
  cessPercent: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxClass {
  id: string;
  name: string;
  description: string | null;
  status: TaxClassStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rates: TaxRate[];
  categories?: { id: string; name: string; slug: string; status: string }[];
  _count?: { categories: number };
}

export interface TaxClassDetail extends TaxClass {
  categories: { id: string; name: string; slug: string; status: string }[];
}

export interface CreateTaxClassRequest {
  name: string;
  description?: string;
}

export type UpdateTaxClassRequest = Partial<CreateTaxClassRequest>;

export interface SetTaxClassStatusRequest {
  status: TaxClassStatus;
  reason: string;
}

export interface CreateTaxRateRequest {
  region?: string;
  ratePercent: number;
  cessPercent?: number;
}

export interface UpdateTaxRateRequest {
  ratePercent?: number;
  cessPercent?: number;
}

export interface QuoteTaxRequest {
  amount: number;
  taxClassId: string;
  sellerState: string;
  buyerState?: string;
  inclusive?: boolean;
  rounding?: "none" | "half-up" | "rup";
}

export interface TaxComponentQuote {
  component: TaxComponent;
  ratePercent: number;
  amount: number;
}

export interface TaxQuoteResult {
  grossAmount: number;
  netAmount: number;
  taxTotal: number;
  components: TaxComponentQuote[];
  preview?: boolean;
}

/* ---------- HSN / SAC codes ---------- */

export type HsnKind = "HSN" | "SAC";

export const HSN_KINDS: HsnKind[] = ["HSN", "SAC"];

/** `gstRatePercent` is a Prisma Decimal — serialized as a string (or null). */
export interface HsnCode {
  id: string;
  kind: HsnKind;
  code: string;
  description: string | null;
  gstRatePercent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHsnCodeRequest {
  kind?: HsnKind;
  code: string;
  description?: string;
  gstRatePercent?: number;
}

export interface UpdateHsnCodeRequest {
  code?: string;
  description?: string | null;
  gstRatePercent?: number | null;
}

/* ---------- units of measure ---------- */

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  dimension: UnitDimension;
  baseCode: string;
  /** Prisma Decimal — serialized as a string. */
  factor: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitRequest {
  code: string;
  name: string;
  dimension: UnitDimension;
  baseCode: string;
  factor: number;
}

export interface UpdateUnitRequest {
  name?: string;
  dimension?: UnitDimension;
  baseCode?: string;
  factor?: number;
}

/* ---------- commerce settings ---------- */

export interface CommerceSettings {
  id: string;
  priceIncludesTax: boolean;
  baseCurrency: string;
  displayCurrency: string;
  roundingMode: RoundingMode;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCommerceSettingsRequest {
  priceIncludesTax?: boolean;
  baseCurrency?: string;
  displayCurrency?: string;
  roundingMode?: RoundingMode;
}
