import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Giriş yap" };

export default function SignInPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-ink">Giriş yap</h1>
      <p className="mt-1 text-muted">Ahtapot hesabınla devam et.</p>
      <SignInForm />
      <p className="mt-6 text-center text-muted">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-ink hover:underline">
          Kayıt ol
        </Link>
      </p>
    </>
  );
}
