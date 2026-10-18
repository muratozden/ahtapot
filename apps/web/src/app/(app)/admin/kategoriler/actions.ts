"use server";

import { revalidatePath } from "next/cache";
import {
  setCategoryFees,
  setCategoryFeesBulk,
  type CategoryFeeInput,
  type CategoryFeePatch,
} from "@/lib/category-commissions";
import { resolveBulkFeeTargetIds, searchCategoriesForPicker, type BulkFeeScope } from "@/lib/marketplace-categories";

export type CategoryPickerRow = {
  id: number;
  name: string;
  path: string;
  isLeaf: boolean;
};
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

function readBulkFeePatchFromForm(formData: FormData): CategoryFeePatch | "invalid" | "empty" {
  const patch: CategoryFeePatch = {};
  let any = false;

  const fields = [
    ["commission", "commissionPercent"],
    ["vat", "vatPercent"],
    ["marketing", "marketingPercent"],
    ["marketplaceService", "marketplaceServicePercent"],
  ] as const;

  for (const [formKey, patchKey] of fields) {
    const text = String(formData.get(formKey) ?? "").trim();
    if (text === "") continue;
    any = true;
    const parsed = parsePercentField(text);
    if (parsed === "invalid") return "invalid";
    patch[patchKey] = parsed;
  }

  if (!any) return "empty";
  return patch;
}

function readFeesFromForm(formData: FormData): CategoryFeeInput | "invalid" {
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
    return "invalid";
  }

  return {
    commissionPercent: commission,
    vatPercent: vat,
    marketingPercent: marketing,
    marketplaceServicePercent: marketplaceService,
  };
}

export async function searchCategoriesForBulkAction(marketplaceId: string, q: string): Promise<CategoryPickerRow[]> {
  if (!(await verifyAdmin())) return [];
  return searchCategoriesForPicker(marketplaceId, q);
}

export async function previewBulkFeeTargetsAction(
  categoryId: number,
  scope: BulkFeeScope,
  leavesOnly: boolean,
): Promise<{ count: number } | { error: string }> {
  if (!(await verifyAdmin())) return { error: FORBIDDEN };
  if (!categoryId) return { count: 0 };

  const ids = await resolveBulkFeeTargetIds(categoryId, scope, leavesOnly);
  return { count: ids.length };
}

export type BulkFeesFormResult = { error?: string; ok?: true; updated?: number };

export async function bulkSetCategoryFeesAction(
  _prev: BulkFeesFormResult | undefined,
  formData: FormData,
): Promise<BulkFeesFormResult> {
  if (!(await verifyAdmin())) return { error: FORBIDDEN };

  const categoryId = Number(formData.get("categoryId"));
  const scope = formData.get("scope") === "subtree" ? "subtree" : "self";
  const leavesOnly = formData.get("leavesOnly") === "on";

  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    return { error: "Önce bir kategori seç." };
  }

  const patch = readBulkFeePatchFromForm(formData);
  if (patch === "invalid") return { error: "Oranlar 0 ile 100 arasında olmalı." };
  if (patch === "empty") return { error: "En az bir oran gir." };

  const targetIds = await resolveBulkFeeTargetIds(categoryId, scope, leavesOnly);
  if (targetIds.length === 0) {
    return { error: "Seçime uyan kategori yok. Kapsam veya yaprak filtresini değiştir." };
  }

  const updated = await setCategoryFeesBulk(targetIds, patch);
  revalidatePath("/admin/kategoriler");
  return { ok: true, updated };
}
