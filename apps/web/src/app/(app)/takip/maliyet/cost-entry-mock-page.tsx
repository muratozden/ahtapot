"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Calculator, RotateCcw } from "lucide-react";
import { hasMarketplaceLogo, MarketplaceLogo } from "@/app/(app)/admin/kategoriler/marketplace-logo";
import { styleForMarketplace } from "@/app/(app)/admin/kategoriler/marketplace-style";
import { cn } from "@/lib/cn";
import type { MarketplaceKey } from "@/lib/buybox/buybox-types";
import { formatPct, formatTry } from "@/lib/buybox/buybox-format";
import { MARKETPLACE_LABELS, MARKETPLACE_ORDER } from "@/lib/buybox/buybox-mock-data";
import { computeMarketplaceProfit } from "@/lib/product-costs/calculator";
import {
  defaultProductCostForm,
  formToProductCost,
  loadProductCosts,
  productCostToForm,
  saveProductCosts,
  upsertProductCost,
} from "@/lib/product-costs/storage";
import { FEE_FIELDS, type ProductCostForm } from "@/lib/product-costs/types";

export function CostEntryMockPage() {
  const [savedNames, setSavedNames] = useState<string[]>(() => loadProductCosts().map((c) => c.name));
  const [form, setForm] = useState<ProductCostForm>(() => defaultProductCostForm());
  const [selectedMp, setSelectedMp] = useState<MarketplaceKey>("trendyol");
  const [savedToast, setSavedToast] = useState(false);

  const results = useMemo(() => {
    const map = {} as Record<MarketplaceKey, ReturnType<typeof computeMarketplaceProfit>>;
    for (const mp of MARKETPLACE_ORDER) map[mp] = computeMarketplaceProfit(form, mp);
    return map;
  }, [form]);

  const bestMp = useMemo(() => {
    return [...MARKETPLACE_ORDER].sort((a, b) => results[b].profit - results[a].profit)[0]!;
  }, [results]);

  const detail = results[selectedMp];

  const patch = useCallback((partial: Partial<ProductCostForm>) => {
    setForm((f) => ({ ...f, ...partial }));
  }, []);

  const patchFee = useCallback((mp: MarketplaceKey, key: keyof ProductCostForm["fees"][MarketplaceKey], value: string) => {
    setForm((f) => ({
      ...f,
      fees: { ...f.fees, [mp]: { ...f.fees[mp], [key]: value } },
    }));
  }, []);

  function loadByName(name: string) {
    const row = loadProductCosts().find((c) => c.name === name);
    if (row) setForm(productCostToForm(row));
  }

  function handleSave() {
    const row = formToProductCost(form);
    if (!row) return;
    const next = upsertProductCost(loadProductCosts(), row);
    saveProductCosts(next);
    setSavedNames(next.map((c) => c.name));
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 3000);
  }

  function handleReset() {
    setForm(defaultProductCostForm());
  }

  const barParts = useMemo(() => {
    const r = detail;
    return [
      { label: "KDV", value: r.gross - r.net, color: "#9ca3af" },
      { label: "Alış", value: r.product, color: "#1f2937" },
      { label: "Pazaryeri", value: r.comm + r.fee, color: "#ea580c" },
      { label: "Kargo, ambalaj, navlun, iade", value: r.ship + r.pkg + r.ret, color: "#2563eb" },
      { label: "Reklam ve sabit", value: r.ads + r.fixed, color: "#7c3aed" },
      { label: "Kâr", value: Math.max(0, r.profit), color: "#065f46" },
    ].filter((p) => p.value > 0);
  }, [detail]);

  const barSum = barParts.reduce((a, p) => a + p.value, 0) || 1;
  const profitColor = detail.profit < 0 ? "text-rise" : "text-drop";

  const breakdownRows: [string, number][] = [
    ["Alış maliyeti", detail.product],
    ["Kargo bedeli", detail.ship],
    ["Ambalaj + navlun", detail.pkg],
    [`Komisyon (%${form.fees[selectedMp].comm})`, detail.comm],
    ["Hizmet bedeli + diğer kesinti", detail.fee],
    ["İade payı", detail.ret],
    ["Reklam payı", detail.ads],
    ["Sabit gider payı", detail.fixed],
  ];

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-card">
            <Calculator className="size-6 text-ink-soft" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Ürün maliyet girişi</h1>
            <p className="mt-1 max-w-2xl text-muted">
              Tutarları KDV hariç gir (satış fiyatı hariç). Kayıtlar buybox ekranındaki kâr hesabında kullanılır.{" "}
              <Link href="/takip/buybox" className="font-semibold text-ink hover:underline">
                Buybox takibi
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink shadow-card hover:bg-canvas"
          >
            <RotateCcw className="size-4" strokeWidth={1.75} />
            Sıfırla
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            Ürünü kaydet
          </button>
        </div>
      </header>

      {savedNames.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase">Kayıtlı ürünler</span>
          {savedNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => loadByName(name)}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
                form.name === name ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft hover:bg-canvas",
              )}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <form className="flex min-w-0 flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
          <Section title="1 · Ürün ve satış">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Ürün adı">
                <input
                  className={inputClass}
                  value={form.name}
                  placeholder="Örn. Çelik termos 750 ml"
                  onChange={(e) => patch({ name: e.target.value })}
                />
              </Field>
              <Field label="Satış fiyatı (KDV dahil)">
                <MoneyInput value={form.price} onChange={(v) => patch({ price: v })} />
              </Field>
              <Field label="KDV oranı">
                <select className={inputClass} value={form.kdv} onChange={(e) => patch({ kdv: e.target.value })}>
                  {["20", "10", "1", "0"].map((v) => (
                    <option key={v} value={v}>
                      %{v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="2 · Ürün maliyeti">
            <Field label="Alış maliyeti" hint="Ürünün birim alış ya da üretim maliyeti">
              <MoneyInput value={form.cost} onChange={(v) => patch({ cost: v })} />
            </Field>
          </Section>

          <Section title="3 · Kargo, ambalaj ve navlun">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Desi">
                <SuffixInput value={form.desi} suffix="desi" step="0.5" onChange={(v) => patch({ desi: v })} />
              </Field>
              <Field label="Kargo bedeli" hint="Müşteriye gönderim ücreti">
                <SuffixInput value={form.ship} suffix="₺ / gönderi" onChange={(v) => patch({ ship: v })} />
              </Field>
              <Field label="Ambalaj" hint="Koli, poşet, bant, etiket">
                <MoneyInput value={form.pack} onChange={(v) => patch({ pack: v })} />
              </Field>
              <Field label="Navlun" hint="Tedarikçiden depoya taşıma">
                <SuffixInput value={form.inbound} suffix="₺ / birim" onChange={(v) => patch({ inbound: v })} />
              </Field>
            </div>
          </Section>

          <Section
            title="4 · Pazaryeri gider kalemleri"
            hint="Her pazaryerinin kendi oranını ilgili sütuna gir. Dar ekranda tabloyu yana kaydırabilirsin."
          >
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="min-w-[860px] w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-canvas">
                    <th className="sticky left-0 z-10 border-r border-line bg-canvas px-3 py-2.5 text-left font-medium text-muted">
                      Gider kalemi
                    </th>
                    {MARKETPLACE_ORDER.map((mp) => (
                      <th key={mp} className="px-3 py-2.5 text-left">
                        <span className="sr-only">{MARKETPLACE_LABELS[mp]}</span>
                        {hasMarketplaceLogo(mp) ? <MarketplaceLogo marketplaceId={mp} /> : MARKETPLACE_LABELS[mp]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEE_FIELDS.map((field) => (
                    <tr key={field.key} className="border-b border-line last:border-0">
                      <th className="sticky left-0 z-10 border-r border-line bg-white px-3 py-2 text-left font-medium text-ink-soft">
                        {field.label}
                        <small className="mt-0.5 block text-[11px] font-normal text-muted">{field.note}</small>
                      </th>
                      {MARKETPLACE_ORDER.map((mp) => (
                        <td key={mp} className="px-2 py-2">
                          <SuffixInput
                            value={form.fees[mp][field.key]}
                            suffix={field.unit}
                            step={field.step}
                            mono
                            onChange={(v) => patchFee(mp, field.key, v)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#fff7ed] text-[#9a3412]">
                    <th className="sticky left-0 z-10 border-r border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-left text-[13px] font-semibold">
                      Pazaryerinin aldığı toplam
                    </th>
                    {MARKETPLACE_ORDER.map((mp) => (
                      <td key={mp} className="px-3 py-2 font-mono text-sm font-semibold tabular-nums">
                        {formatTry(results[mp].cut)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>

          <Section title="5 · İade">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="İade oranı">
                <SuffixInput value={form.ret} suffix="%" step="0.1" onChange={(v) => patch({ ret: v })} />
              </Field>
              <Field label="İade kargo ücreti">
                <MoneyInput value={form.retship} onChange={(v) => patch({ retship: v })} />
              </Field>
            </div>
          </Section>

          <Section title="6 · Pazarlama ve sabit giderler">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Kampanya indirimi">
                <SuffixInput value={form.disc} suffix="%" step="0.5" onChange={(v) => patch({ disc: v })} />
              </Field>
              <Field label="Aylık reklam bütçesi">
                <SuffixInput value={form.ads} suffix="₺ / ay" step="1" onChange={(v) => patch({ ads: v })} />
              </Field>
              <Field label="Aylık sabit giderler" hint="Personel, kira, yazılım, muhasebe">
                <SuffixInput value={form.fixed} suffix="₺ / ay" step="1" onChange={(v) => patch({ fixed: v })} />
              </Field>
              <Field label="Aylık satış adedi" hint="Reklam ve sabit gider bu adede bölünür">
                <SuffixInput value={form.units} suffix="adet" step="1" onChange={(v) => patch({ units: v })} />
              </Field>
            </div>
          </Section>
        </form>

        <aside className="flex min-w-0 flex-col gap-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-bold text-ink">Pazaryerlerine göre birim kâr</h2>
            <div className="mt-3 flex flex-col gap-2">
              {MARKETPLACE_ORDER.map((mp) => {
                const r = results[mp];
                const style = styleForMarketplace(mp);
                const col = r.profit < 0 ? "text-rise" : "text-drop";
                const isBest = mp === bestMp && r.profit > 0;
                return (
                  <button
                    key={mp}
                    type="button"
                    aria-pressed={selectedMp === mp}
                    onClick={() => setSelectedMp(mp)}
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      selectedMp === mp ? "border-drop ring-2 ring-drop/25" : "border-line hover:bg-canvas/50",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                      <span className={cn("size-2.5 shrink-0 rounded-full", style.dot)} />
                      {MARKETPLACE_LABELS[mp]}
                      {isBest ? (
                        <span className="rounded-full bg-drop-soft px-2 py-0.5 text-[11px] font-bold text-drop">
                          En kârlı
                        </span>
                      ) : null}
                    </span>
                    <span className={cn("font-mono text-[15px] font-semibold tabular-nums", col)}>
                      {formatTry(r.profit)}
                    </span>
                    <span className="min-w-[52px] text-right font-mono text-[13px] text-muted tabular-nums">
                      {formatPct(r.margin)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Detayını görmek istediğin pazaryerine tıkla.</p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <p className="text-[13px] font-medium text-muted">
              {MARKETPLACE_LABELS[selectedMp]} · birim net kâr
            </p>
            <p className={cn("mt-1 font-mono text-4xl font-semibold tracking-tight tabular-nums", profitColor)}>
              {formatTry(detail.profit)}
            </p>
            <div className="mt-3 flex flex-wrap gap-5 text-sm text-ink-soft">
              <span>
                Marj <strong className={cn("font-mono", profitColor)}>{formatPct(detail.margin)}</strong>
              </span>
              <span>
                Aylık{" "}
                <strong className="font-mono text-ink">{formatTry(detail.profit * detail.units)}</strong>
              </span>
            </div>
            {detail.profit < 0 ? (
              <p className="mt-4 rounded-xl border border-rise-soft bg-rise-soft px-3 py-2.5 text-[13px] leading-snug text-rise">
                Bu fiyattan her satışta zarar ediliyor. Rakip bu pazaryerinde bu fiyata satıyorsa maliyeti
                seninkinden düşük ya da zararına satıyor.
              </p>
            ) : null}

            <p className="mt-5 text-[13px] font-medium text-muted">Fiyatın dağılımı</p>
            <div className="mt-2 flex h-3.5 overflow-hidden rounded bg-surface">
              {barParts.map((p) => (
                <div key={p.label} style={{ flex: `0 0 ${((p.value / barSum) * 100).toFixed(2)}%`, background: p.color }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
              {barParts.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5">
                  <i className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} />
                  {p.label}
                </span>
              ))}
            </div>

            <div className="mt-5 border-t border-line pt-3">
              <div className="flex justify-between border-b border-line py-2 text-sm font-semibold text-ink">
                <span>Net satış (KDV hariç)</span>
                <span className="font-mono tabular-nums">{formatTry(detail.net)}</span>
              </div>
              {breakdownRows.map(([label, val]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-line py-2 text-sm text-ink-soft">
                  <span>{label}</span>
                  <span className="font-mono text-rise tabular-nums">{formatTry(-val)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 text-[15px] font-semibold text-ink">
                <span>Birim net kâr</span>
                <span className={cn("font-mono tabular-nums", profitColor)}>{formatTry(detail.profit)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-muted">
                <span>Stopaj kesintisi (nakit)</span>
                <span className="font-mono tabular-nums">{formatTry(detail.wht)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-drop-soft bg-drop-soft/40 p-5">
            <p className="text-[13px] font-medium text-drop">Başabaş satış fiyatı (KDV dahil)</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {MARKETPLACE_ORDER.map((mp) => (
                <div key={mp} className="text-xs text-drop">
                  {MARKETPLACE_LABELS[mp]}
                  <strong className="mt-0.5 block font-mono text-[17px] text-[#064e3b] tabular-nums">
                    {formatTry(results[mp].be)}
                  </strong>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-snug text-drop">
              Bu fiyatların altında satan bir rakip, aynı maliyet yapısıyla o pazaryerinde zarar ediyor demektir.
            </p>
          </section>
        </aside>
      </div>

      {savedToast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-dropdown">
          Ürün kaydedildi · Buybox ekranı bu maliyeti kullanır
        </div>
      ) : null}
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function MoneyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <SuffixInput value={value} suffix="₺" onChange={onChange} />;
}

function SuffixInput({
  value,
  suffix,
  step = "0.01",
  mono,
  onChange,
}: {
  value: string;
  suffix: string;
  step?: string;
  mono?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-10 overflow-hidden rounded-xl border border-line bg-white focus-within:ring-2 focus-within:ring-brand/20">
      <input
        type="number"
        min={0}
        step={step}
        className={cn(
          "min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none",
          mono ? "font-mono tabular-nums" : "text-ink",
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="flex items-center border-l border-line bg-canvas px-2.5 text-xs whitespace-nowrap text-muted">
        {suffix}
      </span>
    </div>
  );
}
