import { getCurrentUser } from "@/lib/session";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

// Render these inside <Suspense> with the role-less nav as fallback.

export async function RoleAwareMainNav({ className }: { className?: string }) {
  const user = await getCurrentUser();
  return <MainNav className={className} isAdmin={user.role === "admin"} />;
}

export async function RoleAwareMobileNav() {
  const user = await getCurrentUser();
  return <MobileNav isAdmin={user.role === "admin"} />;
}
