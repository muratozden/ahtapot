"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Field, FormError, SubmitButton } from "@/components/auth/form-parts";

type SellerFormProps = {
  seller?: { name: string; companyName: string | null; email: string };
  action: (form: FormData) => Promise<{ error: string } | undefined>;
};

export function SellerForm({ seller, action }: SellerFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(seller);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await action(form);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <Field label="Ad Soyad" name="name" defaultValue={seller?.name} required autoFocus={!isEdit} />
      <Field label="Firma adı" name="companyName" defaultValue={seller?.companyName ?? ""} required />
      <Field label="E-posta" name="email" type="email" defaultValue={seller?.email} autoComplete="off" required />
      <Field
        label={isEdit ? "Yeni şifre" : "Şifre"}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required={!isEdit}
        hint={
          isEdit
            ? "Değiştirmek istemiyorsan boş bırak. Değiştirirsen satıcının açık oturumları kapanır."
            : "En az 8 karakter. Satıcıya bu şifreyi ilet."
        }
      />
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Link
          href="/admin/saticilar"
          className="flex h-11 items-center justify-center rounded-xl border border-line px-5 font-semibold text-ink transition-colors hover:border-ink-soft/40"
        >
          Vazgeç
        </Link>
        <div className="sm:w-44">
          <SubmitButton pending={pending}>{isEdit ? "Kaydet" : "Satıcı ekle"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
