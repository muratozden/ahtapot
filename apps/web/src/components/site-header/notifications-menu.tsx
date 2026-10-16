"use client";

import Link from "next/link";
import { Bell, TrendingDown, TrendingUp, PackageX } from "lucide-react";
import { Popover } from "radix-ui";
import { cn } from "@/lib/cn";
import { notifications } from "@/lib/mock-data";

const kindStyles = {
  drop: { icon: TrendingDown, className: "bg-drop-soft text-drop" },
  rise: { icon: TrendingUp, className: "bg-rise-soft text-rise" },
  stock: { icon: PackageX, className: "bg-surface text-ink-soft" },
} as const;

export function NotificationsMenu() {
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Bildirimler${unread ? ` (${unread} okunmamış)` : ""}`}
        className="relative grid size-10 place-items-center rounded-full text-ink outline-none transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-surface"
      >
        <Bell className="size-[22px]" strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute top-2 right-2 size-2.5 rounded-full border-2 border-white bg-brand" />
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={12}
          className="z-50 w-[380px] rounded-2xl border border-line bg-white shadow-dropdown data-[state=open]:animate-pop-in"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <p className="text-[15px] font-semibold">Bildirimler</p>
            <button className="text-sm font-medium text-muted hover:text-ink">Tümünü okundu say</button>
          </div>
          <ul className="max-h-[360px] overflow-y-auto px-2">
            {notifications.map((n) => {
              const kind = kindStyles[n.kind];
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className="flex gap-3 rounded-xl px-3 py-3 outline-none hover:bg-surface focus-visible:bg-surface"
                  >
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", kind.className)}>
                      <kind.icon className="size-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink">
                        <span className="font-semibold">{n.title}</span> {n.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{n.time}</span>
                    </span>
                    {n.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-line p-2">
            <Popover.Close asChild>
              <Link
                href="/uyarilar/gecmis"
                className="block rounded-xl py-2.5 text-center text-sm font-semibold text-ink hover:bg-surface"
              >
                Tüm bildirimleri gör
              </Link>
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
