"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { BuyboxProduct, MarketplaceKey, MarketplaceListing, ProductCost } from "@/lib/buybox/buybox-types";
import { MARKETPLACE_LABELS, MARKETPLACE_ORDER } from "@/lib/buybox/buybox-mock-data";
import { emptyListing } from "@/lib/buybox/buybox-economics";

export type EditDialogContext = {
  productIndex: number;
  marketplace: MarketplaceKey | null;
  isNew: boolean;
};

type Draft = MarketplaceListing & { prod: string; mp: MarketplaceKey };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: EditDialogContext | null;
  products: BuyboxProduct[];
  costs: ProductCost[];
  onSave: (draft: Draft, ctx: EditDialogContext) => void;
  onRemove: (ctx: EditDialogContext) => void;
};

const STATUS_OPTIONS: { id: MarketplaceListing["status"]; label: string }[] = [
  { id: "mine", label: "Buybox bende" },
  { id: "lost", label: "Buybox rakipte" },
  { id: "solo", label: "Kartta tek satıcıyım" },
];

export function BuyboxEditDialog({ open, onOpenChange, context, products, costs, onSave, onRemove }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (!open || !context) {
      setDraft(null);
      return;
    }
    const { productIndex, marketplace, isNew } = context;
    const product = productIndex >= 0 ? products[productIndex] : null;
    const existing = product && marketplace ? product.mp[marketplace] : null;
    const firstUnused =
      costs.find((c) => !products.some((p) => p.prod === c.name))?.name ?? costs[0]?.name ?? "";

    setDraft({
      ...(existing ? structuredClone(existing) : emptyListing("lost")),
      prod: product?.prod ?? firstUnused,
      mp: marketplace ?? "trendyol",
    });
  }, [open, context, products, costs]);

  if (!draft || !context) return null;

  const lockProduct = context.productIndex >= 0;
  const lockMarketplace = context.marketplace != null && !context.isNew;
  const title =
    context.productIndex >= 0 && context.marketplace
      ? `${draft.prod} · ${MARKETPLACE_LABELS[context.marketplace]}`
      : context.isNew
        ? "Ürün ekle"
        : `${draft.prod} · link ekle`;

  const productNames = [...new Set([...costs.map((c) => c.name), draft.prod])];

  function update(partial: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...partial } : d));
  }

  function setStatus(status: MarketplaceListing["status"]) {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, status };
      if (status === "solo" && !next.sims.length) next.sims = [{ url: "", price: "", store: "" }];
      return next;
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(90vh,640px)] w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-dropdown outline-none data-[state=open]:animate-pop-in">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="text-[17px] font-bold text-ink">{title}</Dialog.Title>
            <Dialog.Close className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface" aria-label="Kapat">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Ürün">
                <select
                  className={inputClass}
                  value={draft.prod}
                  disabled={lockProduct}
                  onChange={(e) => update({ prod: e.target.value })}
                >
                  {productNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pazaryeri">
                <select
                  className={inputClass}
                  value={draft.mp}
                  disabled={lockMarketplace}
                  onChange={(e) => update({ mp: e.target.value as MarketplaceKey })}
                >
                  {MARKETPLACE_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {MARKETPLACE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Satış fiyatın">
                <div className={boxClass}>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 tabular-nums outline-none"
                    value={draft.price}
                    onChange={(e) => update({ price: e.target.value })}
                  />
                  <span className="border-l border-line bg-canvas px-3 py-2 text-xs text-muted">₺</span>
                </div>
              </Field>
              <Field label="Ürün linkin">
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://…"
                  value={draft.url}
                  onChange={(e) => update({ url: e.target.value })}
                />
              </Field>
            </div>

            <div className="mt-4">
              <p className="text-[13px] font-medium text-ink-soft">Buybox durumu</p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3" role="group" aria-label="Buybox durumu">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={draft.status === s.id}
                    onClick={() => setStatus(s.id)}
                    className={cn(
                      "min-h-11 rounded-xl border px-2 py-2 text-[13px] font-medium transition-colors",
                      draft.status === s.id
                        ? "border-drop bg-drop-soft text-drop"
                        : "border-line bg-white text-ink-soft hover:bg-canvas",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {draft.status === "solo" ? (
              <div className="mt-4 space-y-2">
                <p className="text-[13px] font-medium text-ink-soft">Benzer ürünler</p>
                <p className="text-xs text-muted">En düşük buybox fiyatı rakip fiyatı sayılır.</p>
                {draft.sims.map((sim, j) => (
                  <div key={j} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_100px_36px]">
                    <input
                      type="url"
                      placeholder="Benzer ürün linki"
                      className={inputClass}
                      value={sim.url}
                      onChange={(e) => {
                        const sims = [...draft.sims];
                        sims[j] = { ...sims[j]!, url: e.target.value };
                        update({ sims });
                      }}
                    />
                    <div className={boxClass}>
                      <input
                        type="number"
                        step="0.01"
                        className="min-w-0 flex-1 bg-transparent px-2 py-2 tabular-nums outline-none"
                        value={sim.price}
                        onChange={(e) => {
                          const sims = [...draft.sims];
                          sims[j] = { ...sims[j]!, price: e.target.value };
                          update({ sims });
                        }}
                      />
                      <span className="border-l border-line bg-canvas px-2 text-xs text-muted">₺</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Mağaza"
                      className={inputClass}
                      value={sim.store}
                      onChange={(e) => {
                        const sims = [...draft.sims];
                        sims[j] = { ...sims[j]!, store: e.target.value };
                        update({ sims });
                      }}
                    />
                    <button
                      type="button"
                      className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:text-rise"
                      aria-label="Kaldır"
                      onClick={() => update({ sims: draft.sims.filter((_, i) => i !== j) })}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-[13px] font-semibold text-ink hover:text-brand"
                  onClick={() => update({ sims: [...draft.sims, { url: "", price: "", store: "" }] })}
                >
                  + Benzer ürün linki
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={draft.status === "mine" ? "En yakın rakip fiyatı" : "Buybox fiyatı"}>
                  <div className={boxClass}>
                    <input
                      type="number"
                      step="0.01"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2 tabular-nums outline-none"
                      value={draft.bbPrice}
                      onChange={(e) => update({ bbPrice: e.target.value })}
                    />
                    <span className="border-l border-line bg-canvas px-3 py-2 text-xs text-muted">₺</span>
                  </div>
                </Field>
                <Field label={draft.status === "mine" ? "Rakip mağaza" : "Kazanan mağaza"}>
                  <input
                    type="text"
                    placeholder="Mağaza adı"
                    className={inputClass}
                    value={draft.bbStore}
                    onChange={(e) => update({ bbStore: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line bg-canvas px-5 py-3">
            {!context.isNew && context.marketplace != null && context.productIndex >= 0 ? (
              <button
                type="button"
                className="text-[13px] font-semibold text-rise hover:underline"
                onClick={() => onRemove(context)}
              >
                Pazaryerinden kaldır
              </button>
            ) : (
              <span />
            )}
            <div className="ml-auto flex gap-2">
              <Dialog.Close className="h-10 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink hover:bg-white">
                Vazgeç
              </Dialog.Close>
              <button
                type="button"
                className="h-10 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
                onClick={() => onSave(draft, context)}
              >
                Kaydet
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-canvas disabled:text-ink-soft";

const boxClass = "flex h-10 items-stretch overflow-hidden rounded-xl border border-line bg-white focus-within:ring-2 focus-within:ring-brand/20";
