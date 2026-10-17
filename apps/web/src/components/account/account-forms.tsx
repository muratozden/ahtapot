"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { AccountActionResult } from "@/app/(app)/hesap/actions";
import { Field, FormError, SubmitButton } from "@/components/auth/form-parts";
import type { CurrentUser } from "@/lib/session";
import { cn } from "@/lib/cn";

const roleLabels: Record<CurrentUser["role"], string> = {
  admin: "Admin",
  seller: "Satıcı",
};

function SuccessBanner({ message }: { message: string }) {
  return (
    <p role="status" className="rounded-xl bg-drop-soft px-3.5 py-2.5 font-medium text-drop">
      {message}
    </p>
  );
}

function FormCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ProfileForm({
  user,
  action,
}: {
  user: CurrentUser;
  action: (form: FormData) => Promise<AccountActionResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSeller = user.role === "seller";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await action(form);
      if (result && "error" in result) setError(result.error);
      else if (result && "success" in result) setSuccess("Profil bilgilerin kaydedildi.");
    });
  }

  return (
    <FormCard title="Profil" description="Adın, firma bilgin ve iletişim e-postan.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        {success && <SuccessBanner message={success} />}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5">
          <span className="text-xs font-semibold text-muted uppercase">Hesap türü</span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase",
              user.role === "admin" ? "bg-ink text-white" : "bg-brand-soft text-brand",
            )}
          >
            {roleLabels[user.role]}
          </span>
        </div>
        <Field label="Ad Soyad" name="name" defaultValue={user.name} autoComplete="name" required autoFocus />
        <Field
          label="Firma adı"
          name="companyName"
          defaultValue={user.companyName ?? ""}
          autoComplete="organization"
          required={isSeller}
          hint={isSeller ? undefined : "İsteğe bağlı."}
        />
        <Field label="E-posta" name="email" type="email" defaultValue={user.email} autoComplete="email" required />
        <div className="pt-2 sm:max-w-xs">
          <SubmitButton pending={pending}>Profili kaydet</SubmitButton>
        </div>
      </form>
    </FormCard>
  );
}

export function PasswordForm({ action }: { action: (form: FormData) => Promise<AccountActionResult> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);

    startTransition(async () => {
      const result = await action(form);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      if (result && "success" in result && result.signOut) {
        formElement.reset();
        await authClient.signOut();
        router.replace("/giris");
        router.refresh();
      }
    });
  }

  return (
    <FormCard title="Şifre" description="Giriş şifreni değiştir. Değişiklikten sonra tekrar giriş yapman gerekir.">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <Field
          label="Mevcut şifre"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <Field
          label="Yeni şifre"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="En az 8 karakter."
          required
        />
        <Field
          label="Yeni şifre (tekrar)"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <div className="pt-2 sm:max-w-xs">
          <SubmitButton pending={pending}>Şifreyi güncelle</SubmitButton>
        </div>
      </form>
    </FormCard>
  );
}
