"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Search } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/cn";

const scopes = [
  { id: "urunler", label: "Ürünler" },
  { id: "magazalar", label: "Mağazalar" },
  { id: "markalar", label: "Markalar" },
] as const;

type ScopeId = (typeof scopes)[number]["id"];

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scope, setScope] = useState<ScopeId>("urunler");
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.key !== "/" || target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        if (q) router.push(`/ara?kapsam=${scope}&q=${encodeURIComponent(q)}`);
      }}
      className={cn(
        "group flex h-12 items-center rounded-full border border-transparent bg-surface pr-1 pl-6 transition-[background-color,border-color,box-shadow]",
        "hover:border-line hover:bg-white focus-within:border-line focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(0_0_0/0.06)]",
        className,
      )}
    >
      <label htmlFor="site-search" className="sr-only">
        Ara
      </label>
      <input
        ref={inputRef}
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ürün adı veya URL ara…"
        autoComplete="off"
        className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />

      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger className="group/scope flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-soft outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40">
          {scopes.find((s) => s.id === scope)!.label}
          <ChevronDown
            strokeWidth={2.5}
            className="size-3.5 transition-transform group-data-[state=open]/scope:rotate-180"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={14}
            className="z-50 min-w-44 rounded-2xl border border-line bg-white p-2 shadow-dropdown data-[state=open]:animate-pop-in"
          >
            <DropdownMenu.RadioGroup value={scope} onValueChange={(v) => setScope(v as ScopeId)}>
              {scopes.map((s) => (
                <DropdownMenu.RadioItem
                  key={s.id}
                  value={s.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink outline-none data-highlighted:bg-surface"
                >
                  {s.label}
                  <DropdownMenu.ItemIndicator>
                    <Check className="size-4 text-brand" strokeWidth={2.5} />
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <button
        type="submit"
        aria-label="Ara"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Search className="size-[18px]" strokeWidth={2.25} />
      </button>
    </form>
  );
}
