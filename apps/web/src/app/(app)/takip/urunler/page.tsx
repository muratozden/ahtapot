import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet, Link2, Package } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { listTrackedProductsForSeller } from "@/lib/tracked-products";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Ürünlerim" };

const numberFormat = new Intl.NumberFormat("tr-TR");
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function TrackedProductsPage() {
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-card">
            <Package className="size-6 text-ink-soft" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Ürünlerim</h1>
            <p className="mt-1 max-w-2xl text-muted">
              Takip ettiğin ürünler, kategori ve puan bilgileri ile birlikte. Excel’e aktararak komisyon oranlarını
              tabloda inceleyebilirsin.
            </p>
          </div>
        </div>
        <a
          href="/api/takip/urunler/export"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-semibold text-ink shadow-card hover:bg-canvas"
        >
          <FileSpreadsheet className="size-4 text-drop" strokeWidth={1.75} />
          Excel’e aktar
        </a>
      </header>

      <Suspense fallback={<div className="mt-6 h-80 animate-pulse rounded-2xl bg-surface" />}>
        <ProductTable />
      </Suspense>
    </>
  );
}

async function ProductTable() {
  const user = await getCurrentUser();
  const rows = await listTrackedProductsForSeller(user.id);

  if (rows.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-line bg-white p-10 text-center shadow-card">
        <p className="text-muted">Henüz takip edilen ürün yok.</p>
        <Link
          href="/takip/yeni"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <Link2 className="size-4" strokeWidth={2} />
          URL ekle
        </Link>
        <p className="mt-6">
          <a href="/api/takip/urunler/export" className="text-sm font-semibold text-muted hover:text-ink">
            Boş şablon Excel’i indir
          </a>
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="border-b border-line bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Pazaryeri</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Fiyat</th>
              <th className="px-4 py-3 text-right">Puan</th>
              <th className="px-4 py-3 text-right">Değerlendirme</th>
              <th className="px-4 py-3">Son kontrol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.trackedId} className={cn(!row.isActive && "opacity-60")}>
                <td className="max-w-[280px] px-4 py-3">
                  <a
                    href={row.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink hover:underline"
                  >
                    {row.title ?? row.canonicalUrl}
                  </a>
                  {row.label ? <p className="mt-0.5 truncate text-muted">{row.label}</p> : null}
                </td>
                <td className="px-4 py-3 text-ink-soft">{row.marketplaceName}</td>
                <td className="max-w-[220px] px-4 py-3">
                  <span className="line-clamp-2 text-muted">{row.categoryPath ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink">
                  {row.lastPrice != null
                    ? `${numberFormat.format(Number(row.lastPrice))} ${row.lastCurrency ?? "TRY"}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink">
                  {row.rating != null ? Number(row.rating).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                  {row.reviewCount != null ? numberFormat.format(row.reviewCount) : "—"}
                </td>
                <td className="px-4 py-3 text-muted whitespace-nowrap">
                  {row.lastCheckedAt ? dateFormat.format(row.lastCheckedAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
