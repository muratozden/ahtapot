import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Store } from "lucide-react";
import { listSellers } from "@/lib/sellers";

export const metadata: Metadata = { title: "Satıcılar" };

const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" });

export default function SellersPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-ink">Satıcılar</h1>
        <Link
          href="/admin/saticilar/yeni"
          className="flex h-10 items-center gap-2 rounded-full bg-brand px-4 font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          Satıcı ekle
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <Suspense fallback={<div className="h-48 animate-pulse bg-canvas" />}>
          <SellersTable />
        </Suspense>
      </div>
    </>
  );
}

async function SellersTable() {
  const sellers = await listSellers();

  if (sellers.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-surface">
          <Store className="size-5 text-muted" strokeWidth={1.75} />
        </span>
        <p className="mt-4 font-semibold text-ink">Henüz satıcı yok</p>
        <p className="mt-1 text-muted">Eklediğin satıcılar burada listelenir.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead className="border-b border-line bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
          <tr>
            <th className="px-5 py-3">Ad Soyad</th>
            <th className="px-5 py-3">Firma</th>
            <th className="px-5 py-3">E-posta</th>
            <th className="px-5 py-3">Kayıt</th>
            <th className="px-5 py-3">
              <span className="sr-only">İşlemler</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sellers.map((seller) => (
            <tr key={seller.id} className="hover:bg-canvas">
              <td className="px-5 py-3.5 font-semibold text-ink">{seller.name}</td>
              <td className="px-5 py-3.5 text-ink-soft">{seller.companyName ?? "—"}</td>
              <td className="px-5 py-3.5 text-ink-soft">{seller.email}</td>
              <td className="px-5 py-3.5 whitespace-nowrap text-muted">{dateFormat.format(seller.createdAt)}</td>
              <td className="px-5 py-3.5 text-right">
                <Link
                  href={`/admin/saticilar/${seller.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 font-semibold text-ink transition-colors hover:bg-surface"
                >
                  <Pencil className="size-3.5" strokeWidth={2} />
                  Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-5 py-3 text-muted">{sellers.length} satıcı</p>
    </div>
  );
}
