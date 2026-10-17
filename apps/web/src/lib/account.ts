import "server-only";
import { schema } from "@ahtapot/db";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./db";

const { users, accounts, sessions } = schema;

export type ProfileInput = {
  name: string;
  companyName: string;
  email: string;
};

export type PasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function updateProfile(userId: string, input: ProfileInput) {
  const [updated] = await db
    .update(users)
    .set({
      name: input.name,
      companyName: input.companyName || null,
      email: input.email,
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id });

  return Boolean(updated);
}

export async function changePassword(userId: string, input: PasswordInput) {
  const [account] = await db
    .select({ id: accounts.id, password: accounts.password })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "credential")));

  if (!account?.password) return { ok: false as const, reason: "no-credential" as const };

  const valid = await verifyPassword({ hash: account.password, password: input.currentPassword });
  if (!valid) return { ok: false as const, reason: "wrong-password" as const };

  const password = await hashPassword(input.newPassword);

  await db.transaction(async (tx) => {
    await tx.update(accounts).set({ password }).where(eq(accounts.id, account.id));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
  });

  return { ok: true as const };
}
