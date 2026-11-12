"use server";

import { isAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth/server";

/** Whether the signed-in user is in ADMIN_EMAILS (the list itself never reaches the browser). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth.getSession().catch(() => null);
  return isAdminEmail(session?.data?.user?.email);
}
