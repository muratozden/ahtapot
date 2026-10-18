import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, ShoppingBag, SearchX } from "lucide-react";
import { hasMarketplaceLogo, MarketplaceLogo } from "../kategoriler/marketplace-logo";
import { styleForMarketplace } from "../kategoriler/marketplace-style";
import { cn } from "@/lib/cn";
import {
  countMarketplaceSellers,
  listMarketplaceSellers,
  listMarketplacesForSellerAdmin,
} from "@/lib/marketplace-sellers";

export const metadata: Metadata = { title: "Pazaryeri satıcıları" };

const numberFormat = new Intl.NumberFormat("tr-TR");
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

type Search = { pazaryeri?: string; q?: string; sayfa?: string };

export default function MarketplaceSellersPage({ searchParams }: PageProps<"/admin/pazaryeri-saticilar">) {
  return (
    <>
      <header className="flex flex-wrap items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-card">
          <ShoppingBag className="size-6 text-ink-soft" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-ink">Pazaryeri satıcıları</h1>
          <p className="mt-1 max-w-2xl text-muted">
            Trendyol, n11 ve diğer pazaryerlerindeki mağaza profilleri. Veri eklenti ve parser’lardan senkronize edilir.
          </p>
        </div>
      </header>

      <Suspense fallback={<div className="mt-6 h-36 animate-pulse rounded-2xl bg-surface" />}>
        <Filters searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-2xl bg-surface" />}>
        <SellerTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Filters({ searchParams }: { searchParams: PageProps<"/admin/pazaryeri-saticilar">["searchParams"] }) {
  const sp = await resolveSearch(searchParams);
  const marketplaces = await listMarketplacesForSellerAdmin();
  const marketplaceId = sp.pazaryeri ?? "";

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line bg-gradient-to-r from-canvas via-white to-white px-5 py-4">
        <p className="text-xs font-bold tracking-wide text-muted uppercase">Pazaryeri</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <MarketplaceTab href={tabHref("", sp.q)} active={!marketplaceId} label="Tümü" />
          {marketplaces.map((mp) => (
            <MarketplaceTab
              key={mp.id}
              href={tabHref(mp.id, sp.q)}
              active={marketplaceId === mp.id}
              marketplaceId={mp.id}
              label={mp.name}
            />
          ))}
        </div>
      </div>
      <form method="get" className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        {marketplaceId && <input type="hidden" name="pazaryeri" value={marketplaceId} />}
        <label className="sr-only" htmlFor="seller-search">
          Mağaza ara
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            id="seller-search"
            name="q"
            type="search"
            defaultValue={sp.q ?? ""}
            placeholder="Mağaza adı, ticari ünvan, vergi no…"
            className="h-11 w-full rounded-xl border border-line bg-canvas/50 pr-3 pl-10 text-[13px] outline-none focus:border-drop/40 focus:bg-white focus:ring-4 focus:ring-drop/10"
          />
        </div>
        <button type="submit" className="h-11 shrink-0 rounded-xl bg-brand px-5 font-semibold text-white hover:opacity-95">
          Ara
        </button>
      </form>
    </section>
  );
}

function MarketplaceTab({
  href,
  active,
  label,
  marketplaceId,
}: {
  href: string;
  active: boolean;
  label: string;
  marketplaceId?: string;
}) {
  const accent = marketplaceId ? styleForMarketplace(marketplaceId) : null;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-semibold transition-all",
        active
          ? marketplaceId && accent
            ? accent.tab
            : "border-ink/15 bg-surface text-ink"
          : "border-line bg-white text-ink-soft hover:bg-canvas",
      )}
    >
      {marketplaceId && hasMarketplaceLogo(marketplaceId) ? (
        <MarketplaceLogo marketplaceId={marketplaceId} className={cn(!active && "opacity-40 saturate-0")} />
      ) : (
        label
      )}
      {marketplaceId && hasMarketplaceLogo(marketplaceId) && <span className="sr-only">{label}</span>}
    </Link>
  );
}

function tabHref(pazaryeri: string, q?: string) {
  const p = new URLSearchParams();
  if (pazaryeri) p.set("pazaryeri", pazaryeri);
  if (q) p.set("q", q);
  const qs = p.toString();
  return `/admin/pazaryeri-saticilar${qs ? `?${qs}` : ""}`;
}

async function SellerTable({ searchParams }: { searchParams: PageProps<"/admin/pazaryeri-saticilar">["searchParams"] }) {
  const sp = await resolveSearch(searchParams);
  const page = Math.max(1, parseInt(sp.sayfa ?? "1", 10) || 1);
  const marketplaceId = sp.pazaryeri || undefined;

  const [list, totalAll] = await Promise.all([
    listMarketplaceSellers({ marketplaceId, q: sp.q, page }),
    countMarketplaceSellers(marketplaceId),
  ]);

  const querySuffix = (extra: Record<string, string>) => {
    const p = new URLSearchParams(extra);
    if (marketplaceId) p.set("pazaryeri", marketplaceId);
    if (sp.q) p.set("q", sp.q);
    return `?${p.toString()}`;
  };

  if (totalAll === 0 && !sp.q) {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-line bg-white shadow-card">
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-line bg-surface">
            <ShoppingBag className="size-6 text-muted" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-semibold text-ink">Henüz mağaza kaydı yok</p>
          <p className="mt-1 max-w-md text-muted">
            Pazaryeri mağaza sayfaları toplandıkça profiller burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {list.rows.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <SearchX className="size-8 text-muted" strokeWidth={1.5} />
          <p className="mt-3 font-semibold text-ink">Eşleşen mağaza yok</p>
          <Link href={tabHref(marketplaceId ?? "", "")} className="mt-3 text-sm font-semibold text-drop hover:underline">
            Filtreyi temizle
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-canvas text-xs font-bold tracking-wide text-muted uppercase">
                <th className="px-4 py-3.5">Pazaryeri</th>
                <th className="min-w-[140px] px-4 py-3.5">Mağaza</th>
                <th className="min-w-[160px] px-4 py-3.5">Ticari ünvan</th>
                <th className="px-4 py-3.5">Lokasyon</th>
                <th className="px-4 py-3.5">Vergi no</th>
                <th className="px-4 py-3.5">MERSİS</th>
                <th className="px-4 py-3.5">Telefon</th>
                <th className="px-4 py-3.5 text-right">Kargo ort.</th>
                <th className="px-4 py-3.5 text-right">Mesaj ort.</th>
                <th className="px-4 py-3.5 text-right">Puan</th>
                <th className="px-4 py-3.5 text-right">Ürün</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row, index) => (
                <tr key={row.id} className={cn("border-b border-line/80 last:border-0", index % 2 === 1 && "bg-canvas/50")}>
                  <td className="px-4 py-3.5 align-top">
                    {hasMarketplaceLogo(row.marketplaceId) ? (
                      <MarketplaceLogo marketplaceId={row.marketplaceId} className="h-3.5" />
                    ) : (
                      <span className="text-xs font-semibold text-muted">{row.marketplaceId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    {row.storeUrl ? (
                      <a
                        href={row.storeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-ink hover:text-drop hover:underline"
                      >
                        {row.storeName ?? row.externalSellerId}
                      </a>
                    ) : (
                      <span className="font-semibold text-ink">{row.storeName ?? row.externalSellerId}</span>
                    )}
                    <code className="mt-1 block font-mono text-[10px] text-subtle">{row.externalSellerId}</code>
                  </td>
                  <td className="px-4 py-3.5 align-top text-ink-soft">{cell(row.commercialTitle)}</td>
                  <td className="px-4 py-3.5 align-top text-ink-soft">{cell(row.location)}</td>
                  <td className="px-4 py-3.5 align-top font-mono text-[12px] text-ink-soft">{cell(row.taxId)}</td>
                  <td className="px-4 py-3.5 align-top font-mono text-[12px] text-ink-soft">{cell(row.mersisNo)}</td>
                  <td className="px-4 py-3.5 align-top text-ink-soft">{cell(row.phone)}</td>
                  <td className="px-4 py-3.5 align-top text-right tabular-nums text-ink-soft">
                    {formatDays(row.avgShippingDays)}
                  </td>
                  <td className="px-4 py-3.5 align-top text-right tabular-nums text-ink-soft">
                    {formatHours(row.avgMessageResponseHours)}
                  </td>
                  <td className="px-4 py-3.5 align-top text-right tabular-nums font-semibold text-ink">
                    {formatRating(row.rating)}
                  </td>
                  <td className="px-4 py-3.5 align-top text-right tabular-nums text-ink-soft">
                    {row.productCount != null ? numberFormat.format(row.productCount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/50 px-5 py-3.5 text-sm">
        <span className="text-muted">
          Sayfa <span className="font-semibold text-ink">{list.page}</span> / {list.pageCount}
          <span className="mx-1.5 text-line">·</span>
          {numberFormat.format(list.total)} kayıt
        </span>
        <div className="flex gap-2">
          <PaginationLink
            href={`/admin/pazaryeri-saticilar${querySuffix({ sayfa: String(list.page - 1) })}`}
            disabled={list.page <= 1}
            direction="prev"
          />
          <PaginationLink
            href={`/admin/pazaryeri-saticilar${querySuffix({ sayfa: String(list.page + 1) })}`}
            disabled={list.page >= list.pageCount}
            direction="next"
          />
        </div>
      </div>
    </div>
  );
}

function cell(value: string | null) {
  return value?.trim() ? value : "—";
}

function formatDays(value: string | null) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${numberFormat.format(n)} gün`;
}

function formatHours(value: string | null) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${numberFormat.format(n)} sa`;
}

function formatRating(value: string | null) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

function PaginationLink({
  href,
  disabled,
  direction,
}: {
  href: string;
  disabled: boolean;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Önceki" : "Sonraki";
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-white px-4 font-semibold text-subtle opacity-45">
        {direction === "prev" && <Icon className="size-4" />}
        {label}
        {direction === "next" && <Icon className="size-4" />}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-white px-4 font-semibold text-ink shadow-sm hover:bg-canvas"
    >
      {direction === "prev" && <Icon className="size-4" />}
      {label}
      {direction === "next" && <Icon className="size-4" />}
    </Link>
  );
}

async function resolveSearch(
  searchParams: PageProps<"/admin/pazaryeri-saticilar">["searchParams"],
): Promise<Search> {
  const raw = await searchParams;
  return {
    pazaryeri: typeof raw.pazaryeri === "string" ? raw.pazaryeri : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
    sayfa: typeof raw.sayfa === "string" ? raw.sayfa : undefined,
  };
}
