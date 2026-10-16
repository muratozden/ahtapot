"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, nextPath } from "./auth-errors";
import { Field, FormError, SubmitButton } from "./form-parts";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);

    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: String(form.get("email")),
        password: String(form.get("password")),
        rememberMe: form.get("remember") === "on",
      });
      if (error) {
        setError(authErrorMessage(error));
        return;
      }
      // Next keeps this page's state after navigation; don't leave the password behind for after sign-out.
      formElement.reset();
      router.replace(nextPath());
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <FormError message={error} />
      <Field label="E-posta" name="email" type="email" autoComplete="email" required autoFocus />
      <Field label="Şifre" name="password" type="password" autoComplete="current-password" required />
      <label className="flex w-fit cursor-pointer items-center gap-2 text-ink-soft select-none">
        <input type="checkbox" name="remember" defaultChecked className="size-4 accent-brand" />
        Beni hatırla
      </label>
      <SubmitButton pending={pending}>Giriş yap</SubmitButton>
    </form>
  );
}
