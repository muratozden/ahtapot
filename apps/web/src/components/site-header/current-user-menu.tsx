import { getCurrentUser } from "@/lib/session";
import { UserMenu } from "./user-menu";

export async function CurrentUserMenu() {
  const user = await getCurrentUser();
  return <UserMenu user={user} />;
}
