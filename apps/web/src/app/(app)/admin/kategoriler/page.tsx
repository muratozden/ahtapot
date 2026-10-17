import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  GitBranch,
  Layers,
  SearchX,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { CategoryFeeColumns } from "./category-fee-columns";
import { CategoryFilters } from "./category-filters";
import { hasMarketplaceLogo, MarketplaceLogo } from "./marketplace-logo";
import { styleForMarketplace } from "./marketplace-style";
import { getCategoryFeesForCategories, type CategoryFeeRates } from "@/lib/category-commissions";
import {
  getCategoryListSummary,
  listMarketplaceCategories,
  listMarketplacesForCategories,
} from "@/lib/marketplace-categories";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Kategoriler" };

const numberFormat = new Intl.NumberFormat("tr-TR");

function storedRateToPercent(rate: string): string {
  const n = Number(rate) * 100;
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
}

function feePercentsForRow(fees: CategoryFeeRates) {
  return {
    commission: fees.commission ? storedRateToPercent(fees.commission) : null,
    vat: fees.vat ? storedRateToPercent(fees.vat) : null,
    marketing: fees.marketing ? storedRateToPercent(fees.marketing) : null,
    marketplaceService: fees.marketplaceService ? storedRateToPercent(fees.marketplaceService) : null,
  };
}

const emptyFees: CategoryFeeRates = {
  commission: null,
  vat: null,
  marketing: null,
  marketplaceService: null,
};

type Search = { pazaryeri?: string; q?: string; sayfa?: string };

export default function AdminCategoriesPage({ searchParams }: PageProps<"/admin/kategoriler">) {
  return (
    <>
      <header className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-card">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgb(231_246_239/0.9),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_0%,rgb(250_250_251/1),transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl border border-line shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]",
              "bg-gradient-to-br from-drop-soft to-white text-drop",
            )}
          >
            <FolderTree className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-ink">Pazaryeri kategorileri</h1>
            <p className="mt-1 max-w-2xl text-muted">
              Komisyon ve maliyet hesabı için referans ağaç. Ürün çekiminde gelen kategori ID’leri bu kayıtlarla
              eşleşecek.
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="mt-6 h-36 animate-pulse rounded-2xl bg-surface" />}>
        <Filters searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-2xl bg-surface" />}>
        <CategoryTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Filters({ searchParams }: { searchParams: PageProps<"/admin/kategoriler">["searchParams"] }) {
  const sp = await resolveSearch(searchParams);
  const marketplaces = await listMarketplacesForCategories();
  const marketplaceId = sp.pazaryeri ?? marketplaces.find((m) => m.id === "trendyol")?.id ?? marketplaces[0]?.id ?? "trendyol";

  return <CategoryFilters marketplaces={marketplaces} currentMarketplaceId={marketplaceId} q={sp.q ?? ""} />;
}

function PathTrail({ path }: { path: string }) {
  const parts = path.split(" > ");
  if (parts.length <= 1) return <span className="text-muted">{path}</span>;

  return (
    <span className="mt-1 flex flex-wrap items-center gap-1 text-[12px] leading-relaxed text-muted">
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 shrink-0 text-subtle" strokeWidth={2.5} aria-hidden />}
          <span className={cn(i === parts.length - 1 ? "font-medium text-ink-soft" : "")}>{part}</span>
        </span>
      ))}
    </span>
  );
}

async function CategoryTable({ searchParams }: { searchParams: PageProps<"/admin/kategoriler">["searchParams"] }) {
  const sp = await resolveSearch(searchParams);
  const marketplaces = await listMarketplacesForCategories();
  const marketplaceId = sp.pazaryeri ?? marketplaces.find((m) => m.id === "trendyol")?.id ?? marketplaces[0]?.id ?? "trendyol";
  const page = Math.max(1, parseInt(sp.sayfa ?? "1", 10) || 1);
  const accent = styleForMarketplace(marketplaceId);

  const [summary, list] = await Promise.all([
    getCategoryListSummary(marketplaceId),
    listMarketplaceCategories({ marketplaceId, q: sp.q, page }),
  ]);

  const categoryFees = await getCategoryFeesForCategories(list.rows.map((r) => r.id));

  const mpName = marketplaces.find((m) => m.id === marketplaceId)?.name ?? marketplaceId;
  const branches = summary.total - summary.leaves;

  if (summary.total === 0) {
    return (
      <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-line bg-white shadow-card">
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-line bg-gradient-to-br from-canvas to-drop-soft/40">
            <FolderTree className="size-6 text-drop" strokeWidth={1.75} />
          </span>
          <p className="mt-4 font-semibold text-ink">Henüz kategori yok</p>
          <p className="mt-1 max-w-md text-muted">
            Bu pazaryeri için henüz kategori listesi yüklenmemiş. Daha sonra tekrar kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  const querySuffix = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ pazaryeri: marketplaceId, ...extra });
    if (sp.q) p.set("q", sp.q);
    return `?${p.toString()}`;
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat icon={Layers} label="Toplam kategori" value={numberFormat.format(summary.total)} tint={accent.icon} />
        <MiniStat icon={Tag} label="Yaprak (ürün)" value={numberFormat.format(summary.leaves)} tint="bg-drop-soft text-drop" />
        <MiniStat icon={GitBranch} label="Ara dal" value={numberFormat.format(branches)} tint="bg-canvas text-ink-soft" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            {hasMarketplaceLogo(marketplaceId) ? (
              <MarketplaceLogo marketplaceId={marketplaceId} className="h-4" />
            ) : (
              <span className={cn("size-2.5 rounded-full", accent.dot)} aria-hidden />
            )}
            {!hasMarketplaceLogo(marketplaceId) && <span className="font-bold text-ink">{mpName}</span>}
            {hasMarketplaceLogo(marketplaceId) && <span className="sr-only">{mpName}</span>}
            {sp.q && (
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-line">
                “{sp.q}” · {numberFormat.format(list.total)} sonuç
              </span>
            )}
          </div>
        </div>

        {list.rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-surface text-muted">
              <SearchX className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-3 font-semibold text-ink">Eşleşen kategori yok</p>
            <p className="mt-1 text-sm text-muted">Farklı bir anahtar kelime dene veya filtreyi temizle.</p>
            <Link
              href={`/admin/kategoriler?pazaryeri=${encodeURIComponent(marketplaceId)}`}
              className="mt-4 text-sm font-semibold text-drop hover:underline"
            >
              Filtreyi temizle
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-line bg-gradient-to-b from-canvas to-white text-xs font-bold tracking-wide text-muted uppercase">
                  <th className="px-5 py-3.5 w-[108px]">ID</th>
                  <th className="min-w-[200px] px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5 w-[88px]">Tür</th>
                  <th className="px-3 py-3.5 w-[76px] text-right" title="Komisyon oranı">
                    Komisyon
                  </th>
                  <th className="px-3 py-3.5 w-[76px] text-right" title="KDV oranı">
                    KDV
                  </th>
                  <th className="px-3 py-3.5 w-[88px] text-right leading-snug normal-case">
                    Pazarlama
                    <span className="block text-[10px] font-semibold text-subtle">bedeli</span>
                  </th>
                  <th className="px-3 py-3.5 w-[88px] text-right leading-snug normal-case">
                    Pazaryeri
                    <span className="block text-[10px] font-semibold text-subtle">hizmet bedeli</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-line/80 transition-colors last:border-0 hover:bg-drop-soft/20",
                      index % 2 === 1 && "bg-canvas/40",
                    )}
                  >
                    <td className="px-5 py-4 align-top">
                      <code className="inline-block rounded-lg border border-line bg-white px-2 py-1 font-mono text-[11px] font-semibold text-ink-soft tabular-nums">
                        {row.externalId}
                      </code>
                      {row.depth != null && row.depth > 1 && (
                        <span className="mt-1.5 block text-[10px] font-bold tracking-wide text-subtle uppercase">
                          Seviye {row.depth}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="font-semibold text-ink">{row.name}</span>
                      <PathTrail path={row.path} />
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                          row.isLeaf
                            ? "bg-drop-soft text-drop ring-1 ring-drop/15"
                            : "bg-surface text-muted ring-1 ring-line",
                        )}
                      >
                        {row.isLeaf ? "Yaprak" : "Dal"}
                      </span>
                    </td>
                    <CategoryFeeColumns
                      categoryId={row.id}
                      initial={feePercentsForRow(categoryFees.get(row.id) ?? emptyFees)}
                    />
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
              href={`/admin/kategoriler${querySuffix({ sayfa: String(list.page - 1) })}`}
              disabled={list.page <= 1}
              direction="prev"
            />
            <PaginationLink
              href={`/admin/kategoriler${querySuffix({ sayfa: String(list.page + 1) })}`}
              disabled={list.page >= list.pageCount}
              direction="next"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tint)}>
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="text-lg font-bold tabular-nums text-ink">{value}</p>
      </div>
    </div>
  );
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
      className="inline-flex h-9 items-center gap-1 rounded-full border border-line bg-white px-4 font-semibold text-ink shadow-sm transition-colors hover:border-drop/30 hover:bg-drop-soft/30"
    >
      {direction === "prev" && <Icon className="size-4" />}
      {label}
      {direction === "next" && <Icon className="size-4" />}
    </Link>
  );
}

async function resolveSearch(searchParams: PageProps<"/admin/kategoriler">["searchParams"]): Promise<Search> {
  const raw = await searchParams;
  return {
    pazaryeri: typeof raw.pazaryeri === "string" ? raw.pazaryeri : undefined,
    q: typeof raw.q === "string" ? raw.q : undefined,
    sayfa: typeof raw.sayfa === "string" ? raw.sayfa : undefined,
  };
}
