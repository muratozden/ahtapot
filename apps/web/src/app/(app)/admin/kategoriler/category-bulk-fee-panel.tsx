"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, Layers, Loader2, Search, Tag } from "lucide-react";
import {
  bulkSetCategoryFeesAction,
  previewBulkFeeTargetsAction,
  searchCategoriesForBulkAction,
  type BulkFeesFormResult,
  type CategoryPickerRow,
} from "./actions";
import { cn } from "@/lib/cn";

type Props = {
  marketplaceId: string;
};

const FEE_FIELDS = [
  { name: "commission", label: "Komisyon" },
  { name: "vat", label: "KDV" },
  { name: "marketing", label: "Pazarlama bedeli" },
  { name: "marketplaceService", label: "Pazaryeri hizmet bedeli" },
] as const;

export function CategoryBulkFeePanel({ marketplaceId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CategoryPickerRow[]>([]);
  const [selected, setSelected] = useState<CategoryPickerRow | null>(null);
  const [scope, setScope] = useState<"self" | "subtree">("subtree");
  const [leavesOnly, setLeavesOnly] = useState(false);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [searchPending, startSearch] = useTransition();
  const [countPending, startCount] = useTransition();

  const [state, formAction, submitPending] = useActionState(
    bulkSetCategoryFeesAction,
    undefined as BulkFeesFormResult | undefined,
  );

  const debouncedQuery = useDebouncedValue(query, 280);

  useEffect(() => {
    if (!open) return;
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      const rows = await searchCategoriesForBulkAction(marketplaceId, debouncedQuery);
      setResults(rows);
    });
  }, [debouncedQuery, marketplaceId, open]);

  useEffect(() => {
    if (!selected) {
      setTargetCount(null);
      return;
    }
    startCount(async () => {
      const preview = await previewBulkFeeTargetsAction(selected.id, scope, leavesOnly);
      setTargetCount("count" in preview ? preview.count : null);
    });
  }, [selected, scope, leavesOnly]);

  useEffect(() => {
    if (state?.ok) {
      setQuery("");
      setResults([]);
      setSelected(null);
    }
  }, [state?.ok]);

  const scopeHint = useMemo(() => {
    if (!selected) return null;
    if (scope === "self") return "Yalnızca seçilen satıra uygulanır.";
    return "Seçilen kategori ve altındaki tüm dallar/yapraklar.";
  }, [scope, selected]);

  return (
    <div className="border-t border-line bg-canvas/40 px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Layers className="size-4 text-drop" strokeWidth={1.75} />
          Toplu komisyon güncelle
        </span>
        <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="categoryId" value={selected?.id ?? ""} />
          <input type="hidden" name="scope" value={scope} />
          {leavesOnly && <input type="hidden" name="leavesOnly" value="on" />}

          <div>
            <label htmlFor="bulk-category-search" className="block text-xs font-bold text-muted uppercase">
              Kategori seç
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                id="bulk-category-search"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
                placeholder="Örn. Altın, Bebek Bezi…"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-[13px] outline-none focus:border-drop/40 focus:ring-4 focus:ring-drop/10"
              />
              {searchPending && (
                <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" />
              )}
            </div>
            {results.length > 0 && !selected && (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-card">
                {results.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(row);
                        setResults([]);
                        setQuery(row.path);
                      }}
                      className="w-full px-3 py-2.5 text-left text-[13px] hover:bg-drop-soft/40"
                    >
                      <span className="font-semibold text-ink">{row.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{row.path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && (
            <div className="rounded-xl border border-line bg-white px-3.5 py-3">
              <p className="text-xs font-bold text-muted uppercase">Seçilen</p>
              <p className="mt-1 font-semibold text-ink">{selected.name}</p>
              <p className="text-xs text-muted">{selected.path}</p>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setQuery("");
                }}
                className="mt-2 text-xs font-semibold text-drop hover:underline"
              >
                Seçimi temizle
              </button>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-muted uppercase">Kapsam</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-[13px]">
              <input
                type="radio"
                name="scopeChoice"
                checked={scope === "self"}
                onChange={() => setScope("self")}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold text-ink">Sadece seçilen kategori</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-[13px]">
              <input
                type="radio"
                name="scopeChoice"
                checked={scope === "subtree"}
                onChange={() => setScope("subtree")}
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold text-ink">Seçilen ve altındaki tüm kategoriler</span>
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-[13px]",
                scope === "self" && "opacity-50",
              )}
            >
              <input
                type="checkbox"
                checked={leavesOnly}
                disabled={scope === "self"}
                onChange={(e) => setLeavesOnly(e.target.checked)}
              />
              <span className="font-medium text-ink-soft">Yalnızca yaprak kategorilere uygula</span>
            </label>
          </fieldset>

          {selected && (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Tag className="size-3.5 shrink-0" />
              {countPending ? "Hedef sayılıyor…" : `${targetCount ?? 0} kategoriye uygulanacak`}
              {scopeHint && <span className="text-subtle">· {scopeHint}</span>}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FEE_FIELDS.map((field) => (
              <div key={field.name} className="space-y-1">
                <label htmlFor={`bulk-${field.name}`} className="text-xs font-semibold text-ink-soft">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    id={`bulk-${field.name}`}
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    placeholder="Boş bırak = değişmez"
                    className="h-10 w-full rounded-xl border border-line bg-white px-3 pr-7 text-right text-[13px] font-semibold tabular-nums outline-none focus:border-drop/40 focus:ring-4 focus:ring-drop/10"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[10px] font-bold text-muted">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>

          {state?.error && (
            <p role="alert" className="rounded-xl bg-rise-soft px-3 py-2 text-sm font-medium text-rise">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p role="status" className="rounded-xl bg-drop-soft px-3 py-2 text-sm font-medium text-drop">
              {state.updated} kategoriye oranlar kaydedildi.
            </p>
          )}

          <button
            type="submit"
            disabled={!selected || submitPending || (targetCount ?? 0) === 0}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white hover:opacity-95 disabled:opacity-50 sm:max-w-xs"
          >
            {submitPending && <Loader2 className="size-4 animate-spin" />}
            Toplu kaydet
          </button>
        </form>
      )}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
