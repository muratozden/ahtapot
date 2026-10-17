"use server";

import { revalidatePath } from "next/cache";
import { setCategoryFees, type CategoryFeeInput } from "@/lib/category-commissions";
import { verifyAdmin } from "@/lib/session";

const FORBIDDEN = "Bu işlem için yetkin yok.";

export type CategoryFeesFormResult = { error?: string; ok?: true };

function parsePercentField(raw: unknown): number | null | "invalid" {
  const text = String(raw ?? "")
    .trim()
    .replace(",", ".");
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 100) return "invalid";
  return n;
}

export async function setCategoryFeesAction(
  categoryId: number,
  _prev: CategoryFeesFormResult | undefined,
  formData: FormData,
): Promise<CategoryFeesFormResult> {
  if (!(await verifyAdmin())) return { error: FORBIDDEN };

  const commission = parsePercentField(formData.get("commission"));
  const vat = parsePercentField(formData.get("vat"));
  const marketing = parsePercentField(formData.get("marketing"));
  const marketplaceService = parsePercentField(formData.get("marketplaceService"));

  if (
    commission === "invalid" ||
    vat === "invalid" ||
    marketing === "invalid" ||
    marketplaceService === "invalid"
  ) {
    return { error: "Oranlar 0 ile 100 arasında olmalı." };
  }

  const fees: CategoryFeeInput = {
    commissionPercent: commission,
    vatPercent: vat,
    marketingPercent: marketing,
    marketplaceServicePercent: marketplaceService,
  };

  await setCategoryFees(categoryId, fees);
  revalidatePath("/admin/kategoriler");
  return { ok: true };
}
