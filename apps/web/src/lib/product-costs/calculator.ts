import type { MarketplaceKey } from "@/lib/buybox/buybox-types";
import { num } from "@/lib/buybox/buybox-format";
import type { MarketplaceComputeResult, ProductCostForm } from "./types";

export function computeMarketplaceProfit(form: ProductCostForm, mp: MarketplaceKey): MarketplaceComputeResult {
  const k = num(form.kdv) / 100;
  const units = Math.max(1, num(form.units));
  const dr = num(form.disc) / 100;
  const gross = num(form.price) * (1 - dr);
  const net = gross / (1 + k);
  const f = form.fees[mp];
  const c = num(f.comm) / 100;
  const comm = net * c;
  const fee = num(f.fee) + num(f.early);
  const ship = num(form.ship);
  const product = num(form.cost);
  const pkg = num(form.pack) + num(form.inbound);
  const ret = (num(form.ret) / 100) * (ship + num(form.retship));
  const ads = num(form.ads) / units;
  const fixed = num(form.fixed) / units;
  const flat = product + pkg + fee + ship + ret + ads + fixed;
  const profit = net - comm - flat;
  const be = c < 1 ? (flat / (1 - c)) * (1 + k) / Math.max(0.01, 1 - dr) : 0;
  const wht = (net * num(f.wht)) / 100;

  return {
    gross,
    net,
    comm,
    fee,
    ship,
    product,
    pkg,
    ret,
    ads,
    fixed,
    profit,
    be,
    wht,
    units,
    margin: net > 0 ? (profit / net) * 100 : NaN,
    cut: comm + fee + wht,
  };
}
