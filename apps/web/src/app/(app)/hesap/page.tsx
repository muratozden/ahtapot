import { Suspense } from "react";
import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PasswordForm, ProfileForm } from "@/components/account/account-forms";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/cn";
import { changePasswordAction, updateProfileAction } from "./actions";

export const metadata: Metadata = { title: "Hesap ayarları" };

export default function HesapPage() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <header className="flex items-start gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-gradient-to-br from-canvas to-white text-ink-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]",
          )}
        >
          <Settings className="size-6" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Hesap ayarları</h1>
          <p className="mt-1 text-muted">Profil bilgilerin ve giriş şifren.</p>
        </div>
      </header>

      <Suspense fallback={<HesapSkeleton />}>
        <HesapContent />
      </Suspense>
    </div>
  );
}

async function HesapContent() {
  const user = await getCurrentUser();

  return (
    <div className="mt-8 space-y-6">
      <ProfileForm user={user} action={updateProfileAction} />
      <PasswordForm action={changePasswordAction} />
    </div>
  );
}

function HesapSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <div className="h-72 animate-pulse rounded-2xl bg-surface" />
      <div className="h-80 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
