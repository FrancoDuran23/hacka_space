import "server-only";

import { auth } from "./server";

export async function requireUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    throw new Error("No autenticado");
  }
  return session.user;
}
