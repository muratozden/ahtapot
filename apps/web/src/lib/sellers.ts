import "server-only";
import { randomUUID } from "node:crypto";
import { schema } from "@ahtapot/db";
import { hashPassword } from "better-auth/crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db";
import { requireRole } from "./session";

const { users, accounts, sessions } = schema;

export type Seller = {
  id: string;
  name: string;
  companyName: string | null;
  email: string;
  createdAt: Date;
};

export type SellerInput = {
  name: string;
  companyName: string;
  email: string;
  password?: string;
};

const sellerColumns = {
  id: users.id,
  name: users.name,
  companyName: users.companyName,
  email: users.email,
  createdAt: users.createdAt,
};

export async function listSellers(): Promise<Seller[]> {
  await requireRole("admin");
  // DB reads aren't detected as request-time data, so opt out of prerendering explicitly.
  await connection();
  return db.select(sellerColumns).from(users).where(eq(users.role, "seller")).orderBy(desc(users.createdAt));
}

export async function getSeller(id: string): Promise<Seller | null> {
  await requireRole("admin");
  await connection();
  const [seller] = await db
    .select(sellerColumns)
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "seller")));
  return seller ?? null;
}

export async function isEmailTaken(email: string, exceptUserId?: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(exceptUserId ? and(eq(users.email, email), ne(users.id, exceptUserId)) : eq(users.email, email));
  return Boolean(row);
}

// Callers must verify the admin role first.
export async function createSeller(input: Required<SellerInput>) {
  const userId = randomUUID();
  const password = await hashPassword(input.password);

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: input.name,
      companyName: input.companyName,
      email: input.email,
      role: "seller",
    });
    await tx.insert(accounts).values({
      id: randomUUID(),
      userId,
      accountId: userId,
      providerId: "credential",
      password,
    });
  });

  return userId;
}

// Callers must verify the admin role first. Returns false when no seller has this id.
export async function updateSeller(id: string, input: SellerInput) {
  const password = input.password ? await hashPassword(input.password) : null;

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({ name: input.name, companyName: input.companyName, email: input.email })
      .where(and(eq(users.id, id), eq(users.role, "seller")))
      .returning({ id: users.id });
    if (updated.length === 0) return false;

    if (password) {
      const changed = await tx
        .update(accounts)
        .set({ password })
        .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")))
        .returning({ id: accounts.id });
      if (changed.length === 0) {
        await tx.insert(accounts).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password });
      }
      // A new password signs the seller out everywhere.
      await tx.delete(sessions).where(eq(sessions.userId, id));
    }

    return true;
  });
}
