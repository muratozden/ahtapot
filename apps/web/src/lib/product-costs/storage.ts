import type { MarketplaceKey, ProductCost } from "@/lib/buybox/buybox-types";
import { DEMO_COSTS } from "@/lib/buybox/buybox-mock-data";
import { MARKETPLACE_ORDER } from "@/lib/buybox/buybox-mock-data";
import type { ProductCostForm } from "./types";

export const PRODUCT_COSTS_STORAGE_KEY = "ahtapot-product-costs-v1";

const DEFAULT_MP_FEES: Record<MarketplaceKey, ProductCostForm["fees"][MarketplaceKey]> = {
  trendyol: { comm: "21", fee: "12", early: "0", wht: "1" },
  hepsiburada: { comm: "19", fee: "10", early: "0", wht: "1" },
  amazon_tr: { comm: "15", fee: "0", early: "0", wht: "1" },
  n11: { comm: "18", fee: "8", early: "0", wht: "1" },
};

export function defaultProductCostForm(overrides?: Partial<ProductCostForm>): ProductCostForm {
  return {
    name: "",
    price: "899",
    kdv: "20",
    cost: "320",
    desi: "2",
    ship: "65",
    pack: "12",
    inbound: "8",
    ret: "8",
    retship: "65",
    disc: "0",
    ads: "15000",
    fixed: "40000",
    units: "600",
    fees: structuredClone(DEFAULT_MP_FEES),
    ...overrides,
  };
}

export function productCostToForm(row: ProductCost): ProductCostForm {
  const fees = {} as ProductCostForm["fees"];
  for (const mp of MARKETPLACE_ORDER) {
    const f = row.fees[mp] ?? { comm: 0, fee: 0, early: 0 };
    fees[mp] = {
      comm: String(f.comm),
      fee: String(f.fee),
      early: String(f.early ?? 0),
      wht: "1",
    };
  }
  return {
    name: row.name,
    price: "",
    kdv: String(row.kdv),
    cost: String(row.cost),
    desi: "",
    ship: String(row.ship),
    pack: String(row.pack),
    inbound: String(row.inbound),
    ret: String(row.ret),
    retship: String(row.retship),
    disc: "0",
    ads: String(row.ads),
    fixed: String(row.fixed),
    units: String(row.units),
    fees,
  };
}

export function formToProductCost(form: ProductCostForm): ProductCost | null {
  const name = form.name.trim();
  if (!name) return null;

  const fees = {} as ProductCost["fees"];
  for (const mp of MARKETPLACE_ORDER) {
    const f = form.fees[mp];
    fees[mp] = {
      comm: Number(f.comm) || 0,
      fee: Number(f.fee) || 0,
      early: Number(f.early) || 0,
    };
  }

  return {
    name,
    kdv: Number(form.kdv) || 0,
    cost: Number(form.cost) || 0,
    ship: Number(form.ship) || 0,
    pack: Number(form.pack) || 0,
    inbound: Number(form.inbound) || 0,
    ret: Number(form.ret) || 0,
    retship: Number(form.retship) || 0,
    ads: Number(form.ads) || 0,
    fixed: Number(form.fixed) || 0,
    units: Math.max(1, Number(form.units) || 1),
    fees,
  };
}

export function loadProductCosts(): ProductCost[] {
  if (typeof window === "undefined") return DEMO_COSTS;
  try {
    const raw = localStorage.getItem(PRODUCT_COSTS_STORAGE_KEY);
    if (!raw) return DEMO_COSTS;
    const parsed = JSON.parse(raw) as ProductCost[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEMO_COSTS;
    return parsed;
  } catch {
    return DEMO_COSTS;
  }
}

export function saveProductCosts(rows: ProductCost[]) {
  try {
    localStorage.setItem(PRODUCT_COSTS_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function upsertProductCost(rows: ProductCost[], row: ProductCost): ProductCost[] {
  const idx = rows.findIndex((r) => r.name === row.name);
  if (idx >= 0) {
    const next = [...rows];
    next[idx] = row;
    return next;
  }
  return [...rows, row];
}
