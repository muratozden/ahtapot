"use client";

import Link from "next/link";
import { ChevronDown, Menu, Plus, X } from "lucide-react";
import { Accordion, Dialog } from "radix-ui";
import { Logo } from "./logo";
import { navGroups } from "./nav-config";
import { SearchBar } from "./search-bar";

export function MobileNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label="Menüyü aç"
        className="grid size-10 place-items-center rounded-full text-ink outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
      >
        <Menu className="size-6" strokeWidth={1.75} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-dropdown outline-none data-[state=open]:animate-slide-in">
          <Dialog.Title className="sr-only">Menü</Dialog.Title>
          <Dialog.Description className="sr-only">Ahtapot gezinme menüsü</Dialog.Description>
          <div className="flex h-20 items-center justify-between px-6">
            <Logo />
            <Dialog.Close
              aria-label="Menüyü kapat"
              className="grid size-10 place-items-center rounded-full hover:bg-surface"
            >
              <X className="size-6" strokeWidth={1.75} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <SearchBar className="mb-4 md:hidden" />
            <Accordion.Root type="single" collapsible>
              {navGroups.map((group) => (
                <Accordion.Item key={group.id} value={group.id} className="border-b border-line">
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-base font-semibold text-ink outline-none">
                      {group.label}
                      <ChevronDown
                        strokeWidth={2.5}
                        className="size-4 transition-transform group-data-[state=open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pb-3">
                    {group.items.map((item) => (
                      <Dialog.Close asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface"
                        >
                          <item.icon className="size-[18px] text-muted" strokeWidth={1.75} />
                          <span className="text-sm font-medium text-ink">{item.title}</span>
                        </Link>
                      </Dialog.Close>
                    ))}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>

          <div className="border-t border-line p-6">
            <Dialog.Close asChild>
              <Link
                href="/takip/yeni"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white hover:bg-ink-soft"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                URL Ekle
              </Link>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
