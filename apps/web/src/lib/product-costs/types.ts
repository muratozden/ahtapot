import type { MarketplaceKey } from "@/lib/buybox/buybox-types";

export type MarketplaceFeeForm = {
  comm: string;
  fee: string;
  early: string;
  wht: string;
};

export type ProductCostForm = {
  name: string;
  price: string;
  kdv: string;
  cost: string;
  desi: string;
  ship: string;
  pack: string;
  inbound: string;
  ret: string;
  retship: string;
  disc: string;
  ads: string;
  fixed: string;
  units: string;
  fees: Record<MarketplaceKey, MarketplaceFeeForm>;
};

export type FeeFieldMeta = {
  key: keyof MarketplaceFeeForm;
  label: string;
  note: string;
  unit: string;
  step: string;
};

export const FEE_FIELDS: FeeFieldMeta[] = [
  { key: "comm", label: "Komisyon oranı", note: "Kategoriye göre", unit: "%", step: "0.1" },
  { key: "fee", label: "Hizmet / işlem bedeli", note: "Sipariş başına", unit: "₺", step: "0.01" },
  { key: "early", label: "Diğer kesinti", note: "Erken ödeme, ceza vb. (sipariş başı)", unit: "₺", step: "0.01" },
  { key: "wht", label: "Stopaj", note: "Mahsup edilir, kâra girmez", unit: "%", step: "0.1" },
];

export type MarketplaceComputeResult = {
  gross: number;
  net: number;
  comm: number;
  fee: number;
  ship: number;
  product: number;
  pkg: number;
  ret: number;
  ads: number;
  fixed: number;
  profit: number;
  be: number;
  wht: number;
  units: number;
  margin: number;
  cut: number;
};
