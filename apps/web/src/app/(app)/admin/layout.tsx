import { Suspense, type ReactNode } from "react";
import { requireRole } from "@/lib/session";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="py-8 lg:py-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}

async function AdminGate({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return children;
}
