import type { BuyboxProduct, BuyboxState, MarketplaceKey, ProductCost } from "./buybox-types";
import { emptyListing } from "./buybox-economics";

export const BUYBOX_STORAGE_KEY = "ahtapot-buybox-mock-v1";

export const MARKETPLACE_ORDER: MarketplaceKey[] = ["trendyol", "hepsiburada", "amazon_tr", "n11"];

export const MARKETPLACE_LABELS: Record<MarketplaceKey, string> = {
  trendyol: "Trendyol",
  hepsiburada: "Hepsiburada",
  amazon_tr: "Amazon TR",
  n11: "n11",
};

/** Demo maliyet — maliyet girişi sayfası gelene kadar. */
export const DEMO_COSTS: ProductCost[] = [
  {
    name: "Çelik termos 750 ml",
    kdv: 20,
    cost: 320,
    ship: 65,
    pack: 12,
    inbound: 8,
    ret: 8,
    retship: 65,
    ads: 15000,
    fixed: 40000,
    units: 600,
    fees: {
      trendyol: { comm: 21, fee: 12, early: 0 },
      hepsiburada: { comm: 19, fee: 10, early: 0 },
      amazon_tr: { comm: 15, fee: 0, early: 0 },
      n11: { comm: 18, fee: 8, early: 0 },
    },
  },
  {
    name: "Bambu kesme tahtası seti",
    kdv: 20,
    cost: 140,
    ship: 45,
    pack: 6,
    inbound: 4,
    ret: 5,
    retship: 45,
    ads: 6000,
    fixed: 20000,
    units: 1200,
    fees: {
      trendyol: { comm: 21, fee: 12, early: 0 },
      hepsiburada: { comm: 19, fee: 10, early: 0 },
      amazon_tr: { comm: 15, fee: 0, early: 0 },
      n11: { comm: 18, fee: 8, early: 0 },
    },
  },
  {
    name: "Seramik kupa 2'li",
    kdv: 20,
    cost: 95,
    ship: 40,
    pack: 8,
    inbound: 3,
    ret: 6,
    retship: 40,
    ads: 4000,
    fixed: 15000,
    units: 900,
    fees: {
      trendyol: { comm: 21, fee: 12, early: 0 },
      hepsiburada: { comm: 19, fee: 10, early: 0 },
      amazon_tr: { comm: 15, fee: 0, early: 0 },
      n11: { comm: 18, fee: 8, early: 0 },
    },
  },
];

function L(
  price: string,
  status: "mine" | "lost" | "solo",
  bbPrice = "",
  bbStore = "",
  sims: { url: string; price: string; store: string }[] = [],
) {
  return { url: "", price, status, bbPrice, bbStore, sims };
}

export function demoBuyboxState(): BuyboxState {
  const products: BuyboxProduct[] = [
    {
      prod: "Çelik termos 750 ml",
      mp: {
        trendyol: L("899", "lost", "849.9", "TermoStore"),
        hepsiburada: L("879", "mine", "949", "EvAksesuar"),
        amazon_tr: L(
          "919",
          "solo",
          "",
          "",
          [
            { url: "", price: "869", store: "OutdoorTR" },
            { url: "", price: "889", store: "KampDünyası" },
          ],
        ),
        n11: L("899", "mine", "905", "ŞişeDünyası"),
      },
    },
    {
      prod: "Bambu kesme tahtası seti",
      mp: {
        trendyol: L("449", "lost", "329", "MutfakPlus"),
        hepsiburada: L("439", "lost", "419", "AhşapAtölye"),
        n11: L("429", "mine", "434", "AhşapEv"),
      },
    },
    {
      prod: "Seramik kupa 2'li",
      mp: {
        trendyol: L("329", "mine", "379", "KupaEvi"),
        hepsiburada: L("339", "solo", "", "", [{ url: "", price: "309", store: "SeramikPazar" }]),
        amazon_tr: L("345", "lost", "299", "HomeDeco"),
      },
    },
  ];

  return {
    set: { minMargin: "10", step: "1" },
    view: "prod",
    filter: "all",
    tab: "trendyol",
    products,
  };
}

export function loadBuyboxState(): BuyboxState {
  if (typeof window === "undefined") return demoBuyboxState();
  try {
    const raw = localStorage.getItem(BUYBOX_STORAGE_KEY);
    if (!raw) return demoBuyboxState();
    const parsed = JSON.parse(raw) as BuyboxState;
    if (!parsed?.products?.length) return demoBuyboxState();
    return parsed;
  } catch {
    return demoBuyboxState();
  }
}

export function saveBuyboxState(state: BuyboxState) {
  try {
    localStorage.setItem(BUYBOX_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function costOf(name: string, costs: ProductCost[]): ProductCost | null {
  return costs.find((c) => c.name === name) ?? null;
}
