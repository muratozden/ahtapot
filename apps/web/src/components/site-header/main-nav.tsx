"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, CircleHelp } from "lucide-react";
import { NavigationMenu } from "radix-ui";
import { cn } from "@/lib/cn";
import { navGroups, type NavGroup } from "./nav-config";

type MainNavProps = { className?: string };

export function MainNav(props: MainNavProps) {
  return (
    <Suspense fallback={<NavMenu {...props} />}>
      <NavMenuWithPathname {...props} />
    </Suspense>
  );
}

function NavMenuWithPathname(props: MainNavProps) {
  return <NavMenu {...props} pathname={usePathname()} />;
}

function NavMenu({ className, pathname }: MainNavProps & { pathname?: string }) {
  return (
    <NavigationMenu.Root delayDuration={80} skipDelayDuration={300} className={cn("relative", className)}>
      <NavigationMenu.List className="flex items-center gap-1">
        {navGroups.map((group) => {
          const active = pathname?.startsWith(group.basePath) ?? false;
          return (
            <NavigationMenu.Item key={group.id} value={group.id} className="relative">
              <NavigationMenu.Trigger
                className={cn(
                  "group flex h-10 items-center gap-1 rounded-full px-3.5 text-[13px] font-semibold text-ink outline-none transition-colors",
                  "hover:text-ink-soft focus-visible:ring-2 focus-visible:ring-brand/40",
                  "data-[state=open]:text-ink-soft",
                  active && "text-brand hover:text-brand data-[state=open]:text-brand",
                )}
              >
                {group.label}
                <ChevronDown
                  aria-hidden
                  strokeWidth={2.5}
                  className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content
                className={cn(
                  "absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3",
                  "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
                )}
              >
                <DropdownPanel group={group} />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

function DropdownPanel({ group }: { group: NavGroup }) {
  const wide = Boolean(group.sideLinks?.length);

  return (
    <div className="rounded-2xl border border-line bg-white px-3 pt-3 shadow-dropdown">
      <div className={cn("flex", wide ? "w-[600px]" : "w-[360px]")}>
        <ul className="flex-1 pb-2">
          {group.items.map((item) => (
            <li key={item.href}>
              <NavigationMenu.Link asChild>
                <Link
                  href={item.href}
                  className="flex items-start gap-3.5 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-surface focus-visible:bg-surface"
                >
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink">
                    <item.icon className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-ink">{item.title}</span>
                    <span className="text-sm text-muted">{item.description}</span>
                  </span>
                </Link>
              </NavigationMenu.Link>
            </li>
          ))}
        </ul>

        {wide && (
          <ul className="my-3 ml-2 w-[200px] space-y-1 border-l border-line pl-5">
            {group.sideLinks!.map((link) => (
              <li key={link.href}>
                <NavigationMenu.Link asChild>
                  <Link
                    href={link.href}
                    className="group/side flex items-center gap-1.5 py-2.5 text-sm font-semibold text-ink outline-none hover:text-brand focus-visible:text-brand"
                  >
                    {link.title}
                    <ArrowRight className="size-3.5 transition-transform group-hover/side:translate-x-0.5" />
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {group.footer && (
        <div className="border-t border-line px-3 py-3.5">
          <NavigationMenu.Link asChild>
            <Link
              href={group.footer.href}
              className="flex items-center gap-2 text-sm text-muted outline-none hover:text-ink focus-visible:text-ink"
            >
              <CircleHelp className="size-4 text-ink" strokeWidth={1.75} />
              {group.footer.title}
              <ArrowRight className="size-3.5" />
            </Link>
          </NavigationMenu.Link>
        </div>
      )}
      {!group.footer && <div className="h-1" />}
    </div>
  );
}
