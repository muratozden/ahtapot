import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Link2, MonitorSmartphone, RefreshCw, Store, type LucideIcon } from "lucide-react";
import { getAdminOverview } from "@/lib/admin-overview";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Genel bakış" };

const numberFormat = new Intl.NumberFormat("tr-TR");
const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

export default function AdminOverviewPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-ink">Genel bakış</h1>
      <Suspense fallback={<OverviewSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const { sellerStats, trackedStats, agentStats, jobStats, marketplaceStats, recentSellers } =
    await getAdminOverview();
  const finishedJobs = jobStats.done + jobStats.failed;

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Store}
          label="Satıcılar"
          value={numberFormat.format(sellerStats.total)}
          hint={`Son 7 günde +${numberFormat.format(sellerStats.newThisWeek)}`}
        />
        <StatCard
          icon={Link2}
          label="Takip edilen URL"
          value={numberFormat.format(trackedStats.tracked)}
          hint={`${numberFormat.format(trackedStats.uniqueListings)} benzersiz ürün`}
        />
        <StatCard
          icon={MonitorSmartphone}
          label="Aktif eklenti"
          value={`${agentStats.online} / ${agentStats.active}`}
          hint={agentStats.active === 0 ? "Henüz eklenti eklenmedi" : "Son 10 dakikada bağlanan / toplam"}
        />
        <StatCard
          icon={RefreshCw}
          label="Son 24 saat çekim"
          value={numberFormat.format(jobStats.done)}
          hint={
            finishedJobs === 0
              ? "Henüz çekim yok"
              : `Başarı oranı %${Math.round((jobStats.done / finishedJobs) * 100)}`
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Pazaryerleri" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead className="border-b border-line bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Pazaryeri</th>
                  <th className="px-5 py-3">Durum</th>
                  <th className="px-5 py-3 text-right">Ürün</th>
                  <th className="px-5 py-3 text-right">24s çekim</th>
                  <th className="px-5 py-3 text-right">24s hata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {marketplaceStats.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3.5 font-semibold text-ink">{m.name}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          m.isActive ? "bg-drop-soft text-drop" : "bg-surface text-muted",
                        )}
                      >
                        {m.isActive ? "Açık" : "Kapalı"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-soft tabular-nums">
                      {numberFormat.format(m.listings)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink-soft tabular-nums">
                      {numberFormat.format(m.done24h)}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3.5 text-right tabular-nums",
                        m.failed24h > 0 ? "font-semibold text-rise" : "text-ink-soft",
                      )}
                    >
                      {numberFormat.format(m.failed24h)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Son eklenen satıcılar"
          action={
            <Link
              href="/admin/saticilar"
              className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink"
            >
              Tümü
              <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {recentSellers.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted">Henüz satıcı yok.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentSellers.map((seller) => (
                <li key={seller.id}>
                  <Link
                    href={`/admin/saticilar/${seller.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-canvas"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{seller.name}</span>
                      <span className="block truncate text-muted">{seller.companyName ?? "—"}</span>
                    </span>
                    <span className="shrink-0 text-muted">{dateFormat.format(seller.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 font-semibold text-muted">
        <Icon className="size-4" strokeWidth={1.75} />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink tabular-nums">{value}</p>
      <p className="mt-1 text-muted">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-line bg-white shadow-card", className)}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
      <div className="mt-6 h-72 animate-pulse rounded-2xl bg-surface" />
    </>
  );
}
