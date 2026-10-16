import "server-only";
import type { UserRole } from "@ahtapot/db/schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  "use cache: private";

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/giris");

  const { id, name, email, role, companyName } = session.user;
  return { id, name, email, role: role as UserRole, companyName: companyName ?? null };
}

export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.role !== role) redirect("/");
  return user;
}
