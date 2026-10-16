// Usage: npm run create-admin -w @ahtapot/web -- --email you@example.com --name "Ad Soyad" --password "********"
// An existing user with the same email is promoted to admin; their password is left unchanged.
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { createDb, schema } from "@ahtapot/db";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
  },
});

const email = values.email?.trim().toLowerCase();
if (!email) {
  console.error("--email zorunlu.");
  process.exit(1);
}

const db = createDb();

try {
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });

  if (existing) {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, existing.id));
    console.log(`${email} admin yapıldı.`);
  } else {
    if (!values.name || !values.password || values.password.length < 8) {
      console.error("Yeni admin için --name ve en az 8 karakterlik --password zorunlu.");
      process.exit(1);
    }

    const userId = randomUUID();
    const password = await hashPassword(values.password);

    await db.transaction(async (tx) => {
      await tx.insert(schema.users).values({
        id: userId,
        name: values.name!,
        email,
        emailVerified: true,
        role: "admin",
      });
      await tx.insert(schema.accounts).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password,
      });
    });
    console.log(`Admin oluşturuldu: ${email}`);
  }
} finally {
  await db.$client.end();
}
