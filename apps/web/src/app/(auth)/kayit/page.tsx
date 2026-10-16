import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Kayıt ol" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-ink">Satıcı hesabı oluştur</h1>
      <p className="mt-1 text-muted">Ürünlerinin fiyatlarını takip etmeye başla.</p>
      <SignUpForm />
      <p className="mt-6 text-center text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold text-ink hover:underline">
          Giriş yap
        </Link>
      </p>
    </>
  );
}
