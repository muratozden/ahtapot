import type {
  Advice,
  BuyboxSettings,
  BuyboxStatus,
  ListingEconomics,
  MarketplaceKey,
  MarketplaceListing,
  ProductCost,
} from "./buybox-types";
import { formatPct, formatSignedTry, formatTry, has, num } from "./buybox-format";

export function buildEconomics(
  cost: ProductCost | null,
  mp: MarketplaceKey,
  settings: BuyboxSettings,
): ListingEconomics | null {
  if (!cost) return null;
  const k = num(cost.kdv) / 100;
  const f = cost.fees[mp] ?? { comm: 0, fee: 0, early: 0 };
  const cm = num(f.comm) / 100;
  const mm = num(settings.minMargin) / 100;
  const flat =
    num(cost.cost) +
    num(cost.pack) +
    num(cost.inbound) +
    num(cost.ship) +
    num(f.fee) +
    num(f.early) +
    (num(cost.ret) / 100) * (num(cost.ship) + num(cost.retship)) +
    (num(cost.ads) + num(cost.fixed)) / Math.max(1, num(cost.units));

  return {
    profit(p: number) {
      const net = p / (1 + k);
      return net * (1 - cm) - flat;
    },
    margin(p: number) {
      const net = p / (1 + k);
      return net > 0 ? ((net * (1 - cm) - flat) / net) * 100 : NaN;
    },
    be: cm < 1 ? (flat / (1 - cm)) * (1 + k) : Infinity,
    floor: 1 - cm - mm > 0 ? (flat / (1 - cm - mm)) * (1 + k) : Infinity,
  };
}

export function refPrice(l: MarketplaceListing): { p: number; s: string } | null {
  if (l.status !== "solo") {
    return has(l.bbPrice) ? { p: num(l.bbPrice), s: l.bbStore } : null;
  }
  let best: { p: number; s: string } | null = null;
  for (const x of l.sims) {
    if (!has(x.price)) continue;
    const p = num(x.price);
    if (!best || p < best.p) best = { p, s: x.store };
  }
  return best;
}

export function adviseListing(
  l: MarketplaceListing,
  E: ListingEconomics | null,
  settings: BuyboxSettings,
): Advice {
  const ref = refPrice(l);
  const mine = num(l.price);
  const step = num(settings.step);

  if (!E) {
    return { kind: "none", title: "Maliyet yok", text: "Maliyet girişi ekranı yakında eklenecek." };
  }
  if (!ref) {
    return {
      kind: "none",
      title: "Rakip fiyatı yok",
      text: l.status === "solo" ? "Benzer ürün linki ekle" : "Rakip fiyatını gir",
    };
  }

  const target = Math.round((ref.p - step) * 100) / 100;

  if (l.status === "mine" || (l.status === "solo" && ref.p > mine)) {
    if (target > mine + 0.009) {
      return {
        kind: "up",
        title: "Fiyatı artır",
        text: `Buybox sende kalır, birim ${formatSignedTry(E.profit(target) - E.profit(mine))}`,
        price: target,
      };
    }
    return { kind: "ok", title: "Fiyatın yerinde", text: `Rakiple fark ${formatTry(ref.p - mine)}` };
  }

  if (mine <= target) {
    return {
      kind: "info",
      title: "Fiyatın zaten düşük",
      text: "Buybox fiyat dışı nedenle kaybediliyor olabilir",
    };
  }
  if (target >= E.floor) {
    return {
      kind: "win",
      title: "Buybox kârlı alınır",
      text: `Kâr ${formatTry(E.profit(target))} (${formatPct(E.margin(target))})`,
      price: target,
    };
  }
  if (target >= E.be) {
    return {
      kind: "thin",
      title: "Alınır, marj düşük",
      text: `Marj ${formatPct(E.margin(target))} · min. marjla ${formatTry(E.floor)}`,
      price: target,
    };
  }
  return { kind: "loss", title: "Zararına, girme", text: `Başabaşın ${formatTry(E.be)}` };
}

export function emptyListing(status: BuyboxStatus = "lost"): MarketplaceListing {
  return { url: "", price: "", status, bbPrice: "", bbStore: "", sims: [] };
}
