import type { Metadata } from "next";
import { SellerForm } from "@/components/admin/seller-form";
import { BackLink } from "../back-link";
import { createSellerAction } from "../actions";

export const metadata: Metadata = { title: "Satıcı ekle" };

export default function NewSellerPage() {
  return (
    <div className="max-w-xl">
      <BackLink />
      <h1 className="mt-4 text-xl font-bold text-ink">Satıcı ekle</h1>
      <p className="mt-1 text-muted">Satıcı bu e-posta ve şifreyle giriş yapar.</p>
      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <SellerForm action={createSellerAction} />
      </div>
    </div>
  );
}
