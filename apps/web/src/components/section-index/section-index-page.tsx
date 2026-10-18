import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import type { NavGroup } from "@/components/site-header/nav-config";
import { sectionNavEntriesForBasePath } from "@/lib/section-nav";
import { cn } from "@/lib/cn";

const sectionIntros: Record<string, string> = {
  takip: "Ürün linklerini ekle, listele ve fiyat değişimlerini izle.",
  analiz: "Geçmiş fiyatları, rakipleri ve özet raporları incele.",
  uyarilar: "Alarmlar kur ve bildirim kanallarını yönet.",
  kaynaklar: "Yardım, API ve güncellemeler.",
};

type SectionIndexPageProps = {
  group: NavGroup;
};

export function SectionIndexPage({ group }: SectionIndexPageProps) {
  const entries = sectionNavEntriesForBasePath(group.basePath);
  const intro = sectionIntros[group.id] ?? "";

  return (
    <div className="py-8">
      <header className="max-w-2xl">
        <h1 className="text-xl font-bold tracking-tight text-ink">{group.label}</h1>
        {intro ? <p className="mt-2 text-muted">{intro}</p> : null}
      </header>

      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              className={cn(
                "group flex h-full items-start gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-card outline-none transition-colors",
                "hover:bg-canvas/50 focus-visible:ring-2 focus-visible:ring-brand/30",
              )}
            >
              <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink">
                <entry.icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink">{entry.title}</span>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                    strokeWidth={2.5}
                  />
                </span>
                {entry.description ? (
                  <span className="mt-1 block text-sm leading-snug text-muted">{entry.description}</span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {group.footer ? (
        <p className="mt-8">
          <Link
            href={group.footer.href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <CircleHelp className="size-4 text-ink" strokeWidth={1.75} />
            {group.footer.title}
            <ArrowRight className="size-3.5" />
          </Link>
        </p>
      ) : null}
    </div>
  );
}
