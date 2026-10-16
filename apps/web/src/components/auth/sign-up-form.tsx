"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "./auth-errors";
import { Field, FormError, SubmitButton } from "./form-parts";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);

    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        name: String(form.get("name")).trim(),
        companyName: String(form.get("companyName")).trim(),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) {
        setError(authErrorMessage(error));
        return;
      }
      formElement.reset();
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <FormError message={error} />
      <Field label="Ad Soyad" name="name" autoComplete="name" required autoFocus />
      <Field label="Firma adı" name="companyName" autoComplete="organization" required />
      <Field label="E-posta" name="email" type="email" autoComplete="email" required />
      <Field
        label="Şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="En az 8 karakter."
        required
      />
      <SubmitButton pending={pending}>Hesap oluştur</SubmitButton>
    </form>
  );
}
