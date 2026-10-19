export type MarketplaceKey = "trendyol" | "hepsiburada" | "amazon_tr" | "n11";

export type BuyboxStatus = "mine" | "lost" | "solo";

export type SimilarListing = {
  url: string;
  price: string;
  store: string;
};

export type MarketplaceListing = {
  url: string;
  price: string;
  status: BuyboxStatus;
  bbPrice: string;
  bbStore: string;
  sims: SimilarListing[];
};

export type BuyboxProduct = {
  prod: string;
  mp: Partial<Record<MarketplaceKey, MarketplaceListing>>;
};

export type BuyboxSettings = {
  minMargin: string;
  step: string;
};

export type BuyboxView = "prod" | "mp";

export type BuyboxFilterId =
  | "all"
  | "mine"
  | "lost"
  | "solo"
  | "win"
  | "up"
  | "loss";

export type BuyboxState = {
  set: BuyboxSettings;
  view: BuyboxView;
  filter: BuyboxFilterId;
  tab: MarketplaceKey;
  products: BuyboxProduct[];
};

export type ProductCostFees = {
  comm: number;
  fee: number;
  early: number;
};

export type ProductCost = {
  name: string;
  kdv: number;
  cost: number;
  ship: number;
  pack: number;
  inbound: number;
  ret: number;
  retship: number;
  ads: number;
  fixed: number;
  units: number;
  fees: Partial<Record<MarketplaceKey, ProductCostFees>>;
};

export type AdviceKind = "none" | "win" | "up" | "thin" | "loss" | "ok" | "info";

export type Advice = {
  kind: AdviceKind;
  title: string;
  text: string;
  price?: number;
};

export type ListingEconomics = {
  profit: (price: number) => number;
  margin: (price: number) => number;
  be: number;
  floor: number;
};

export type ListingInfo = {
  l: MarketplaceListing;
  E: ListingEconomics | null;
  a: Advice;
  ref: { p: number; s: string } | null;
};
