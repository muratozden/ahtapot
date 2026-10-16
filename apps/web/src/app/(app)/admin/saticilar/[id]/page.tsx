import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerForm } from "@/components/admin/seller-form";
import { getSeller } from "@/lib/sellers";
import { BackLink } from "../back-link";
import { updateSellerAction } from "../actions";

export const metadata: Metadata = { title: "Satıcıyı düzenle" };

export default function EditSellerPage({ params }: PageProps<"/admin/saticilar/[id]">) {
  return (
    <div className="max-w-xl">
      <BackLink />
      <h1 className="mt-4 text-xl font-bold text-ink">Satıcıyı düzenle</h1>
      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-canvas" />}>
          <EditSeller params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditSeller({ params }: Pick<PageProps<"/admin/saticilar/[id]">, "params">) {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) notFound();

  return <SellerForm seller={seller} action={updateSellerAction.bind(null, seller.id)} />;
}
