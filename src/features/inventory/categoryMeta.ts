import type { MedicineCategory } from "./inventoryTypes";

export interface CategoryMeta {
  /** Two-letter marker used in the POS product tiles. */
  initials: string;
  tileBg: string;
  tileText: string;
  /** Solid color for charts and legends. */
  color: string;
}

/**
 * One muted tint per medicine category. Colors are functional (scanning aids),
 * never decorative — keep them desaturated so status colors stay dominant.
 */
export const CATEGORY_META: Record<MedicineCategory, CategoryMeta> = {
  Tablet: {
    initials: "TB",
    tileBg: "bg-primary-soft",
    tileText: "text-primary",
    color: "#0F766E",
  },
  Capsule: {
    initials: "CP",
    tileBg: "bg-info-soft",
    tileText: "text-info",
    color: "#175CD3",
  },
  Syrup: {
    initials: "SY",
    tileBg: "bg-warn-soft",
    tileText: "text-warn",
    color: "#B45309",
  },
  Injection: {
    initials: "IN",
    tileBg: "bg-danger-soft",
    tileText: "text-danger",
    color: "#B42318",
  },
  Other: {
    initials: "OT",
    tileBg: "bg-[#EEF1EF]",
    tileText: "text-ink-soft",
    color: "#6B7873",
  },
};

export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Other",
];
