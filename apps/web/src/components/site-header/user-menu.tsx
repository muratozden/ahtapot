"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, LogOut, Settings, Users } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import type { CurrentUser } from "@/lib/session";

const links = [
  { label: "Hesap ayarları", href: "/hesap", icon: Settings },
  { label: "Abonelik ve fatura", href: "/hesap/abonelik", icon: CreditCard },
  { label: "Ekip", href: "/hesap/ekip", icon: Users },
];

const roleLabels: Record<CurrentUser["role"], string> = {
  admin: "Admin",
  seller: "Satıcı",
};

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr");
}

export function UserMenu({ user }: { user: CurrentUser }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/giris");
    router.refresh();
  }

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label="Hesap menüsü"
        className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand to-[#7b3fe4] text-sm font-bold text-white outline-none ring-offset-2 transition-shadow hover:ring-2 hover:ring-line focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:ring-2 data-[state=open]:ring-line"
      >
        {initialsOf(user.name)}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={12}
          className="z-50 w-64 rounded-2xl border border-line bg-white p-2 shadow-dropdown data-[state=open]:animate-pop-in"
        >
          <div className="px-3 pt-2 pb-3">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-semibold">{user.name}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase",
                  user.role === "admin" ? "bg-ink text-white" : "bg-brand-soft text-brand",
                )}
              >
                {roleLabels[user.role]}
              </span>
            </div>
            <p className="truncate text-sm text-muted">{user.email}</p>
            {user.companyName && <p className="truncate text-sm text-muted">{user.companyName}</p>}
          </div>
          <DropdownMenu.Separator className="mx-1 mb-1 h-px bg-line" />
          {links.map((l) => (
            <DropdownMenu.Item key={l.href} asChild>
              <Link
                href={l.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink outline-none data-highlighted:bg-surface"
              >
                <l.icon className="size-4 text-muted" strokeWidth={1.75} />
                {l.label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="mx-1 my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={signOut}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink outline-none data-highlighted:bg-surface"
          >
            <LogOut className="size-4 text-muted" strokeWidth={1.75} />
            Çıkış yap
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
