import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import type { SectionNavEntry } from "@/lib/section-nav";
import { cn } from "@/lib/cn";

type SectionPlaceholderPageProps = {
  entry: SectionNavEntry;
  sectionHref: string;
  sectionLabel: string;
};

export function SectionPlaceholderPage({ entry, sectionHref, sectionLabel }: SectionPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-lg py-16">
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <span
          className={cn(
            "mx-auto grid size-14 place-items-center rounded-2xl border border-line bg-gradient-to-br from-canvas to-white text-ink-soft",
          )}
        >
          <Construction className="size-7" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-ink">{entry.title}</h1>
        {entry.description ? <p className="mt-2 text-muted">{entry.description}</p> : null}
        <p className="mt-4 text-sm text-muted">Bu ekran henüz hazır değil; yakında burada olacak.</p>
        <Link
          href={sectionHref}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          {sectionLabel} menüsüne dön
        </Link>
      </div>
    </div>
  );
}
