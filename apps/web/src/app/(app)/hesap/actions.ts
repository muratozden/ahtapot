"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { changePassword, updateProfile } from "@/lib/account";
import { isEmailTaken } from "@/lib/sellers";

export type AccountActionResult = { error: string } | { success: true; signOut?: boolean } | undefined;

const EMAIL_TAKEN = "Bu e-posta ile kayıtlı bir hesap var.";

async function requireSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session) return null;
  return session.user;
}

function readProfile(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  return {
    name: text("name"),
    companyName: text("companyName"),
    email: text("email").toLowerCase(),
  };
}

function validateProfile(input: ReturnType<typeof readProfile>, role: string) {
  if (!input.name) return "Ad Soyad zorunlu.";
  if (role === "seller" && !input.companyName) return "Firma adı zorunlu.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return "Geçerli bir e-posta adresi gir.";
  return null;
}

export async function updateProfileAction(form: FormData): Promise<AccountActionResult> {
  const user = await requireSessionUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const input = readProfile(form);
  const error = validateProfile(input, user.role ?? "seller");
  if (error) return { error };
  if (await isEmailTaken(input.email, user.id)) return { error: EMAIL_TAKEN };

  const ok = await updateProfile(user.id, input);
  if (!ok) return { error: "Profil güncellenemedi." };

  revalidatePath("/hesap");
  return { success: true };
}

export async function changePasswordAction(form: FormData): Promise<AccountActionResult> {
  const user = await requireSessionUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");

  if (!currentPassword) return { error: "Mevcut şifreni gir." };
  if (!newPassword) return { error: "Yeni şifre zorunlu." };
  if (newPassword.length < 8) return { error: "Yeni şifre en az 8 karakter olmalı." };
  if (newPassword.length > 128) return { error: "Şifre çok uzun." };
  if (newPassword !== confirmPassword) return { error: "Yeni şifreler eşleşmiyor." };

  const result = await changePassword(user.id, { currentPassword, newPassword });
  if (!result.ok) {
    if (result.reason === "wrong-password") return { error: "Mevcut şifre hatalı." };
    return { error: "Şifre güncellenemedi." };
  }

  return { success: true, signOut: true };
}
