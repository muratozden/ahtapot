"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSeller, isEmailTaken, updateSeller, type SellerInput } from "@/lib/sellers";
import { verifyAdmin } from "@/lib/session";

export type SellerFormResult = { error: string } | undefined;

const EMAIL_TAKEN = "Bu e-posta ile kayıtlı bir hesap var.";
const FORBIDDEN = "Bu işlem için yetkin yok.";

function readInput(form: FormData): Required<SellerInput> {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  return {
    name: text("name"),
    companyName: text("companyName"),
    email: text("email").toLowerCase(),
    password: String(form.get("password") ?? ""),
  };
}

function validate(input: Required<SellerInput>, passwordRequired: boolean) {
  if (!input.name) return "Ad Soyad zorunlu.";
  if (!input.companyName) return "Firma adı zorunlu.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return "Geçerli bir e-posta adresi gir.";
  if (passwordRequired && !input.password) return "Şifre zorunlu.";
  if (input.password && input.password.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (input.password.length > 128) return "Şifre çok uzun.";
  return null;
}

function isUniqueViolation(error: unknown) {
  const code = (e: unknown) => (e as { code?: string } | null)?.code;
  return code(error) === "23505" || code((error as { cause?: unknown } | null)?.cause) === "23505";
}

export async function createSellerAction(form: FormData): Promise<SellerFormResult> {
  if (!(await verifyAdmin())) return { error: FORBIDDEN };

  const input = readInput(form);
  const error = validate(input, true);
  if (error) return { error };
  if (await isEmailTaken(input.email)) return { error: EMAIL_TAKEN };

  try {
    await createSeller(input);
  } catch (e) {
    if (isUniqueViolation(e)) return { error: EMAIL_TAKEN };
    throw e;
  }

  revalidatePath("/admin/saticilar");
  redirect("/admin/saticilar");
}

export async function updateSellerAction(id: string, form: FormData): Promise<SellerFormResult> {
  if (!(await verifyAdmin())) return { error: FORBIDDEN };

  const input = readInput(form);
  const error = validate(input, false);
  if (error) return { error };
  if (await isEmailTaken(input.email, id)) return { error: EMAIL_TAKEN };

  let found: boolean;
  try {
    found = await updateSeller(id, { ...input, password: input.password || undefined });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: EMAIL_TAKEN };
    throw e;
  }
  if (!found) return { error: "Satıcı bulunamadı." };

  revalidatePath("/admin/saticilar");
  redirect("/admin/saticilar");
}
