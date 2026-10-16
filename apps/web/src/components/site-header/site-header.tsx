import { Suspense } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { CurrentUserMenu } from "./current-user-menu";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { NotificationsMenu } from "./notifications-menu";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 xl:gap-8 xl:px-8">
        <div className="flex items-center gap-1">
          <MobileNav />
          <Logo />
        </div>

        <SearchBar className="hidden max-w-[520px] flex-1 md:flex" />

        <MainNav className="hidden lg:block" />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/takip/yeni"
            aria-label="URL Ekle"
            className="hidden h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink-soft/40 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none sm:flex xl:px-5"
          >
            <Link2 className="size-4" strokeWidth={2} />
            <span className="hidden xl:inline">URL Ekle</span>
          </Link>
          <NotificationsMenu />
          <Suspense fallback={<div className="size-10 rounded-full bg-surface" />}>
            <CurrentUserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
