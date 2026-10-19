"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Plus } from "lucide-react";
import { hasMarketplaceLogo, MarketplaceLogo } from "@/app/(app)/admin/kategoriler/marketplace-logo";
import { styleForMarketplace } from "@/app/(app)/admin/kategoriler/marketplace-style";
import { cn } from "@/lib/cn";
import { adviseListing, buildEconomics, refPrice } from "@/lib/buybox/buybox-economics";
import { formatPct, formatTry, has, num } from "@/lib/buybox/buybox-format";
import {
  costOf,
  loadBuyboxState,
  MARKETPLACE_LABELS,
  MARKETPLACE_ORDER,
  saveBuyboxState,
} from "@/lib/buybox/buybox-mock-data";
import { loadProductCosts, PRODUCT_COSTS_STORAGE_KEY } from "@/lib/product-costs/storage";
import type {
  Advice,
  BuyboxFilterId,
  BuyboxProduct,
  BuyboxState,
  BuyboxView,
  ListingInfo,
  MarketplaceKey,
  ProductCost,
} from "@/lib/buybox/buybox-types";
import { BuyboxEditDialog, type EditDialogContext } from "./buybox-edit-dialog";

const STATUS_BADGE = {
  mine: { label: "Buybox sende", className: "bg-drop-soft text-drop" },
  lost: { label: "Buybox rakipte", className: "bg-rise-soft text-rise" },
  solo: { label: "Tek satıcı", className: "bg-brand-soft text-ink" },
} as const;

const FILTERS: {
  id: BuyboxFilterId;
  label: string;
  color: string;
  match: (l: ListingInfo["l"], a: Advice) => boolean;
}[] = [
  { id: "all", label: "Tümü", color: "#0a0a0b", match: () => true },
  { id: "mine", label: "Buybox sende", color: "#065f46", match: (l) => l.status === "mine" },
  { id: "lost", label: "Buybox kaybedilen", color: "#b91c1c", match: (l) => l.status === "lost" },
  { id: "solo", label: "Tek satıcı", color: "#1e40af", match: (l) => l.status === "solo" },
  { id: "win", label: "Kârlı alınabilir", color: "#065f46", match: (_, a) => a.kind === "win" },
  { id: "up", label: "Fiyat artırılabilir", color: "#065f46", match: (_, a) => a.kind === "up" },
  { id: "loss", label: "Zararına rakip", color: "#b91c1c", match: (_, a) => a.kind === "loss" },
];

const ADVICE_CLASS: Record<string, string> = {
  win: "text-drop",
  up: "text-drop",
  thin: "text-amber-700",
  loss: "text-rise",
  ok: "text-ink-soft",
  info: "text-muted",
  none: "text-muted",
};

export function BuyboxMockPage() {
  const [state, setState] = useState<BuyboxState | null>(null);
  const [costs, setCosts] = useState(() => loadProductCosts());
  const [isDemo, setIsDemo] = useState(() => {
    if (typeof window === "undefined") return true;
    return !localStorage.getItem(PRODUCT_COSTS_STORAGE_KEY);
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCtx, setDialogCtx] = useState<EditDialogContext | null>(null);
  const [toast, setToast] = useState<{ msg: string; snap: BuyboxState } | null>(null);

  useEffect(() => {
    setState(loadBuyboxState());
    setCosts(loadProductCosts());
    setIsDemo(!localStorage.getItem(PRODUCT_COSTS_STORAGE_KEY));
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PRODUCT_COSTS_STORAGE_KEY) {
        setCosts(loadProductCosts());
        setIsDemo(!e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: BuyboxState) => {
    setState(next);
    saveBuyboxState(next);
  }, []);

  const listingInfo = useCallback(
    (product: BuyboxProduct, mp: MarketplaceKey): ListingInfo | null => {
      const l = product.mp[mp];
      if (!l) return null;
      const E = buildEconomics(costOf(product.prod, costs), mp, state?.set ?? { minMargin: "10", step: "1" });
      const a = adviseListing(l, E, state?.set ?? { minMargin: "10", step: "1" });
      return { l, E, a, ref: refPrice(l) };
    },
    [costs, state?.set],
  );

  const passesFilter = useCallback(
    (info: ListingInfo) => {
      const f = FILTERS.find((x) => x.id === state?.filter) ?? FILTERS[0]!;
      return f.match(info.l, info.a);
    },
    [state?.filter],
  );

  const filterCounts = useMemo(() => {
    if (!state) return {} as Record<BuyboxFilterId, number>;
    const counts = Object.fromEntries(FILTERS.map((f) => [f.id, 0])) as Record<BuyboxFilterId, number>;
    for (const p of state.products) {
      for (const mp of MARKETPLACE_ORDER) {
        const info = listingInfo(p, mp);
        if (!info) continue;
        if (state.view === "mp" && mp !== state.tab) continue;
        for (const f of FILTERS) {
          if (f.match(info.l, info.a)) counts[f.id]++;
        }
      }
    }
    return counts;
  }, [state, listingInfo]);

  if (!state) {
    return <div className="mt-8 h-80 animate-pulse rounded-2xl bg-surface" />;
  }

  function openAdd() {
    setDialogCtx({ productIndex: -1, marketplace: null, isNew: true });
    setDialogOpen(true);
  }

  function openEdit(productIndex: number, marketplace: MarketplaceKey) {
    setDialogCtx({ productIndex, marketplace, isNew: !state!.products[productIndex]?.mp[marketplace] });
    setDialogOpen(true);
  }

  function applyPrice(productIndex: number, mp: MarketplaceKey) {
    const snap = structuredClone(state!);
    const p = snap.products[productIndex];
    if (!p) return;
    const info = listingInfo(p, mp);
    if (!info?.a.price) return;
    const l = p.mp[mp]!;
    const old = num(l.price);
    l.price = String(info.a.price);
    if (l.status === "lost") l.status = "mine";
    persist(snap);
    setToast({
      msg: `${p.prod} · ${MARKETPLACE_LABELS[mp]}: ${formatTry(old)} → ${formatTry(info.a.price!)}`,
      snap: state!,
    });
    window.setTimeout(() => setToast(null), 6000);
  }

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-card">
            <Crown className="size-6 text-ink-soft" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Buybox takibi</h1>
            <p className="mt-1 max-w-2xl text-muted">
              Her ürünü tüm pazaryerlerinde tek satırda gör, öneriyi tek tıkla uygula. Maliyetler{" "}
              <a href="/takip/maliyet" className="font-semibold text-ink hover:underline">
                maliyet girişi
              </a>{" "}
              ekranından gelir.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
        >
          <Plus className="size-4" strokeWidth={2.2} />
          Ürün ekle
        </button>
      </header>

      <section className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-card">
        <ViewToggle view={state.view} onChange={(view) => persist({ ...state, view })} />
        <label className="flex items-center gap-2 text-[13px] text-ink-soft">
          Minimum marj
          <span className="flex h-9 items-stretch overflow-hidden rounded-xl border border-line bg-white">
            <input
              type="number"
              step="0.5"
              min={0}
              className="w-16 bg-transparent px-2 tabular-nums outline-none"
              value={state.set.minMargin}
              onChange={(e) => persist({ ...state, set: { ...state.set, minMargin: e.target.value } })}
            />
            <span className="flex items-center border-l border-line bg-canvas px-2 text-xs text-muted">%</span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink-soft">
          Rakibin altına in
          <span className="flex h-9 items-stretch overflow-hidden rounded-xl border border-line bg-white">
            <input
              type="number"
              step="0.01"
              min={0}
              className="w-16 bg-transparent px-2 tabular-nums outline-none"
              value={state.set.step}
              onChange={(e) => persist({ ...state, set: { ...state.set, step: e.target.value } })}
            />
            <span className="flex items-center border-l border-line bg-canvas px-2 text-xs text-muted">₺</span>
          </span>
        </label>
        <p
          className={cn(
            "ml-auto flex items-center gap-2 text-xs text-muted",
            isDemo && "text-amber-800",
          )}
        >
          <span className={cn("size-2 rounded-full", isDemo ? "bg-amber-500" : "bg-drop")} />
          {isDemo ? "Örnek maliyet verisi" : `Maliyet girişinden · ${costs.length} ürün`}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7" role="group" aria-label="Duruma göre filtrele">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={state.filter === f.id}
            onClick={() => persist({ ...state, filter: f.id })}
            className={cn(
              "flex min-h-[72px] flex-col items-start gap-0.5 rounded-2xl border bg-white px-3 py-3 text-left shadow-card transition-colors",
              state.filter === f.id ? "border-ink ring-1 ring-ink" : "border-line hover:bg-canvas/50",
            )}
          >
            <span className="font-mono text-2xl font-semibold tabular-nums" style={{ color: f.color }}>
              {filterCounts[f.id] ?? 0}
            </span>
            <span className="text-xs font-medium text-muted">{f.label}</span>
          </button>
        ))}
      </div>

      {state.view === "mp" && (
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Pazaryeri">
          {MARKETPLACE_ORDER.map((mp) => {
            const n = state.products.filter((p) => p.mp[mp]).length;
            const style = styleForMarketplace(mp);
            const selected = state.tab === mp;
            return (
              <button
                key={mp}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => persist({ ...state, tab: mp })}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
                  selected ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:bg-canvas",
                )}
              >
                <span className={cn("size-2 rounded-full", selected ? "bg-white" : style.dot)} />
                <span>{MARKETPLACE_LABELS[mp]}</span>
                <span className="font-mono text-xs opacity-75">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          {state.view === "prod" ? (
            <ProductView
              state={state}
              costs={costs}
              listingInfo={listingInfo}
              passesFilter={passesFilter}
              onEdit={openEdit}
              onApply={applyPrice}
            />
          ) : (
            <MarketplaceView
              state={state}
              listingInfo={listingInfo}
              passesFilter={passesFilter}
              onEdit={openEdit}
              onApply={applyPrice}
            />
          )}
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-dropdown">
          <span>{toast.msg}</span>
          <button
            type="button"
            className="font-semibold text-drop-soft"
            onClick={() => {
              persist(toast.snap);
              setToast(null);
            }}
          >
            Geri al
          </button>
        </div>
      ) : null}

      <BuyboxEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        context={dialogCtx}
        products={state.products}
        costs={costs}
        onSave={(draft, ctx) => {
          const next = structuredClone(state);
          let product = next.products.find((p) => p.prod === draft.prod);
          if (!product) {
            product = { prod: draft.prod, mp: {} };
            next.products.push(product);
          }
          if (!ctx.isNew && ctx.productIndex >= 0 && ctx.marketplace && ctx.marketplace !== draft.mp) {
            delete next.products[ctx.productIndex]!.mp[ctx.marketplace];
          }
          product.mp[draft.mp] = {
            url: draft.url,
            price: draft.price,
            status: draft.status,
            bbPrice: draft.bbPrice,
            bbStore: draft.bbStore,
            sims: draft.sims,
          };
          persist(next);
          setDialogOpen(false);
        }}
        onRemove={(ctx) => {
          if (!confirm("Bu ürün bu pazaryeri takibinden çıkarılsın mı?")) return;
          const next = structuredClone(state);
          const p = next.products[ctx.productIndex];
          if (p && ctx.marketplace) {
            delete p.mp[ctx.marketplace];
            if (Object.keys(p.mp).length === 0) next.products.splice(ctx.productIndex, 1);
          }
          persist(next);
          setDialogOpen(false);
        }}
      />
    </>
  );
}

function ViewToggle({ view, onChange }: { view: BuyboxView; onChange: (v: BuyboxView) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-xl border border-line" role="group" aria-label="Görünüm">
      {(
        [
          ["prod", "Ürüne göre"],
          ["mp", "Pazaryerine göre"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => onChange(id)}
          className={cn(
            "h-10 px-3.5 text-[13px] font-semibold transition-colors",
            view === id ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-canvas",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ProductView({
  state,
  costs,
  listingInfo,
  passesFilter,
  onEdit,
  onApply,
}: {
  state: BuyboxState;
  costs: ProductCost[];
  listingInfo: (p: BuyboxProduct, mp: MarketplaceKey) => ListingInfo | null;
  passesFilter: (i: ListingInfo) => boolean;
  onEdit: (pi: number, mp: MarketplaceKey) => void;
  onApply: (pi: number, mp: MarketplaceKey) => void;
}) {
  const rows = state.products
    .map((p, pi) => {
      const infos = MARKETPLACE_ORDER.map((mp) => listingInfo(p, mp)).filter(Boolean) as ListingInfo[];
      if (state.filter !== "all" && !infos.some(passesFilter)) return null;
      const mine = infos.filter((x) => x.l.status === "mine").length;
      const hasCost = costOf(p.prod, costs);
      return (
        <tr key={p.prod}>
          <td className="min-w-[200px] px-3 py-3 align-top">
            <p className="font-semibold text-ink">{p.prod}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {infos.length} pazaryerinde
              <br />
              Buybox {mine}/{infos.length} sende
              {!hasCost ? (
                <>
                  <br />
                  <span className="text-rise">Maliyet kaydı yok</span>
                </>
              ) : null}
            </p>
          </td>
          {MARKETPLACE_ORDER.map((mp) => (
            <td key={mp} className="min-w-[240px] px-2 py-3 align-top">
              <ListingCell
                productIndex={pi}
                mp={mp}
                info={listingInfo(p, mp)}
                dimmed={listingInfo(p, mp) ? !passesFilter(listingInfo(p, mp)!) : false}
                onEdit={onEdit}
                onApply={onApply}
              />
            </td>
          ))}
        </tr>
      );
    })
    .filter(Boolean);

  return (
    <table className="min-w-[1180px] w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-line bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
          <th className="px-3 py-3 text-left">Ürün</th>
          {MARKETPLACE_ORDER.map((mp) => (
            <th key={mp} className="px-3 py-3 text-left">
              <span className="sr-only">{MARKETPLACE_LABELS[mp]}</span>
              {hasMarketplaceLogo(mp) ? <MarketplaceLogo marketplaceId={mp} /> : MARKETPLACE_LABELS[mp]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.length ? (
          rows
        ) : (
          <tr>
            <td colSpan={5} className="px-4 py-12 text-center text-muted">
              Bu filtrede ürün yok.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function MarketplaceView({
  state,
  listingInfo,
  passesFilter,
  onEdit,
  onApply,
}: {
  state: BuyboxState;
  listingInfo: (p: BuyboxProduct, mp: MarketplaceKey) => ListingInfo | null;
  passesFilter: (i: ListingInfo) => boolean;
  onEdit: (pi: number, mp: MarketplaceKey) => void;
  onApply: (pi: number, mp: MarketplaceKey) => void;
}) {
  const mp = state.tab;
  const rows = state.products
    .map((p, pi) => {
      const info = listingInfo(p, mp);
      if (!info || !passesFilter(info)) return null;
      const { l, E, a, ref } = info;
      const st = STATUS_BADGE[l.status];
      const profit = E ? E.profit(num(l.price)) : null;
      const profitColor = profit != null && profit < 0 ? "text-rise" : "text-drop";
      const refProfit = E && ref ? E.profit(ref.p) : null;
      const refColor = refProfit != null && refProfit < 0 ? "text-rise" : "text-drop";

      return (
        <tr key={p.prod} className="text-[13px]">
          <td className="px-4 py-3 font-semibold text-ink">{p.prod}</td>
          <td className="px-4 py-3 text-right font-mono tabular-nums">{has(l.price) ? formatTry(num(l.price)) : "—"}</td>
          <td className="px-4 py-3 text-right">
            {profit != null && E ? (
              <>
                <span className={cn("font-mono font-semibold tabular-nums", profitColor)}>{formatTry(profit)}</span>
                <span className="mt-0.5 block font-mono text-xs text-muted">{formatPct(E.margin(num(l.price)))}</span>
              </>
            ) : (
              "—"
            )}
          </td>
          <td className="px-4 py-3">
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-bold", st.className)}>
              {st.label}
            </span>
          </td>
          <td className="px-4 py-3 text-right">
            {ref ? (
              <>
                <span className="font-mono font-semibold tabular-nums">{formatTry(ref.p)}</span>
                {ref.s ? <span className="mt-0.5 block text-xs text-muted">{ref.s}</span> : null}
              </>
            ) : (
              "—"
            )}
          </td>
          <td className="px-4 py-3 text-right">
            {refProfit != null && E && ref ? (
              <>
                <span className={cn("font-mono font-semibold tabular-nums", refColor)}>{formatTry(refProfit)}</span>
                <span className="mt-0.5 block font-mono text-xs text-muted">{formatPct(E.margin(ref.p))}</span>
              </>
            ) : (
              "—"
            )}
          </td>
          <td className="min-w-[200px] px-4 py-3">
            <p className={cn("font-semibold", ADVICE_CLASS[a.kind])}>{a.title}</p>
            <p className="text-xs text-muted">{a.text}</p>
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-1.5">
              {a.price != null ? (
                <button
                  type="button"
                  onClick={() => onApply(pi, mp)}
                  className={cn(
                    "h-8 rounded-lg px-2.5 text-xs font-semibold text-white",
                    a.kind === "thin" ? "bg-amber-600 hover:bg-amber-700" : "bg-drop hover:opacity-90",
                  )}
                >
                  {formatTry(a.price)} uygula
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onEdit(pi, mp)}
                className="h-8 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink hover:bg-canvas"
              >
                Düzenle
              </button>
            </div>
          </td>
        </tr>
      );
    })
    .filter(Boolean);

  return (
    <table className="min-w-[1080px] w-full border-collapse">
      <thead>
        <tr className="border-b border-line bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
          <th className="px-4 py-3 text-left">Ürün</th>
          <th className="px-4 py-3 text-right">Senin fiyatın</th>
          <th className="px-4 py-3 text-right">Kârın</th>
          <th className="px-4 py-3 text-left">Durum</th>
          <th className="px-4 py-3 text-right">Rakip fiyatı</th>
          <th className="px-4 py-3 text-right">O fiyatta kârın</th>
          <th className="px-4 py-3 text-left">Öneri</th>
          <th className="px-4 py-3 text-right">Aksiyon</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.length ? (
          rows
        ) : (
          <tr>
            <td colSpan={8} className="px-4 py-12 text-center text-muted">
              {MARKETPLACE_LABELS[mp]} için bu filtrede listeleme yok.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ListingCell({
  productIndex,
  mp,
  info,
  dimmed,
  onEdit,
  onApply,
}: {
  productIndex: number;
  mp: MarketplaceKey;
  info: ListingInfo | null;
  dimmed: boolean;
  onEdit: (pi: number, mp: MarketplaceKey) => void;
  onApply: (pi: number, mp: MarketplaceKey) => void;
}) {
  if (!info) {
    return (
      <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-line bg-canvas/60">
        <button
          type="button"
          onClick={() => onEdit(productIndex, mp)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas"
        >
          + Link ekle
        </button>
      </div>
    );
  }

  const { l, E, a, ref } = info;
  const st = STATUS_BADGE[l.status];
  const profit = E ? E.profit(num(l.price)) : null;
  const profitColor = profit != null && profit < 0 ? "text-rise" : "text-drop";
  const refLbl = l.status === "mine" ? "Yakın rakip" : l.status === "solo" ? "Benzer ürün" : "Buybox";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-line bg-white p-2.5",
        dimmed && "opacity-35",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", st.className)}>{st.label}</span>
        <span className="font-mono text-base font-semibold tabular-nums text-ink">
          {has(l.price) ? formatTry(num(l.price)) : "—"}
        </span>
      </div>
      <div className="flex justify-between gap-2 text-xs text-muted">
        <span>Kârın</span>
        <span className={cn("font-mono font-semibold tabular-nums", profitColor)}>
          {profit != null && E ? `${formatTry(profit)} · ${formatPct(E.margin(num(l.price)))}` : "—"}
        </span>
      </div>
      <div className="flex justify-between gap-2 text-xs text-muted">
        <span className="truncate">
          {refLbl}
          {ref?.s ? ` · ${ref.s}` : ""}
        </span>
        <span className="shrink-0 font-mono font-semibold tabular-nums">{ref ? formatTry(ref.p) : "—"}</span>
      </div>
      <div className="border-t border-line pt-2 text-xs">
        <p className={cn("font-semibold", ADVICE_CLASS[a.kind])}>{a.title}</p>
        <p className="text-muted">{a.text}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {a.price != null ? (
          <button
            type="button"
            onClick={() => onApply(productIndex, mp)}
            className={cn(
              "min-h-8 flex-1 rounded-lg px-2 text-xs font-semibold text-white",
              a.kind === "thin" ? "bg-amber-600" : "bg-drop",
            )}
          >
            {formatTry(a.price)} uygula
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(productIndex, mp)}
          className="min-h-8 flex-1 rounded-lg border border-line px-2 text-xs font-semibold hover:bg-canvas"
        >
          Düzenle
        </button>
      </div>
    </div>
  );
}
