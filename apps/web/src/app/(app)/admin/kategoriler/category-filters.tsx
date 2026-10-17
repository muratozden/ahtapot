import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { styleForMarketplace } from "./marketplace-style";

type Props = {
  marketplaces: { id: string; name: string }[];
  currentMarketplaceId: string;
  q: string;
};

export function CategoryFilters({ marketplaces, currentMarketplaceId, q }: Props) {
  const current = styleForMarketplace(currentMarketplaceId);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line bg-gradient-to-r from-drop-soft/35 via-canvas to-white px-5 py-4">
        <p className="text-xs font-bold tracking-wide text-muted uppercase">Pazaryeri</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {marketplaces.map((mp) => {
            const active = mp.id === currentMarketplaceId;
            const accent = styleForMarketplace(mp.id);
            const href = `/admin/kategoriler?pazaryeri=${encodeURIComponent(mp.id)}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link
                key={mp.id}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all",
                  active
                    ? cn(accent.tab, "scale-[1.02]")
                    : "border-line bg-white text-ink-soft hover:border-ink-soft/25 hover:bg-canvas hover:text-ink",
                )}
              >
                <span className={cn("size-2 shrink-0 rounded-full", active ? accent.dot : "bg-line")} aria-hidden />
                {mp.name}
              </Link>
            );
          })}
        </div>
      </div>

      <form method="get" className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <input type="hidden" name="pazaryeri" value={currentMarketplaceId} />
        <label className="sr-only" htmlFor="category-search">
          Kategori ara
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            strokeWidth={2}
            aria-hidden
          />
          <input
            id="category-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={`${current.label} kategorilerinde ara…`}
            className="h-11 w-full rounded-xl border border-line bg-canvas/50 pr-3 pl-10 text-[13px] text-ink outline-none placeholder:text-subtle focus:border-drop/40 focus:bg-white focus:ring-4 focus:ring-drop/10"
          />
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-xl bg-brand px-5 font-semibold text-white shadow-[0_1px_2px_rgb(13_12_34/0.12)] transition-[opacity,transform] hover:opacity-95 active:scale-[0.99]"
        >
          Ara
        </button>
      </form>
    </section>
  );
}
