"use server";

import { randomBytes } from "node:crypto";

import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage } from "ethers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { FUJI_CHAIN_ID } from "@/lib/chain";
import { db } from "@/lib/db";
import {
  type WalletChallenge,
  walletChallenges,
  wallets,
} from "@/lib/db/schema";

// Wallets are linked and listed from the operator panel.
const WALLETS_PATH = "/operador";

async function currentUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

export async function createWalletChallenge(address: string) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: "No autenticado" };
  if (!isAddress(address)) {
    return { ok: false as const, error: "Dirección de wallet inválida" };
  }

  const checksummed = getAddress(address);
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const message = [
    "OrbitClear quiere vincular esta wallet a tu cuenta.",
    `Wallet: ${checksummed}`,
    `Usuario: ${user.id}`,
    `Red: Avalanche Fuji (${FUJI_CHAIN_ID})`,
    `Nonce: ${nonce}`,
    `Vence: ${expiresAt.toISOString()}`,
  ].join("\n");

  const [row] = await db
    .insert(walletChallenges)
    .values({ userId: user.id, address: checksummed, nonce, message, expiresAt })
    .returning({ id: walletChallenges.id });

  return { ok: true as const, challengeId: row.id, message };
}

export async function verifyAndLinkWallet(
  challengeId: string,
  signature: string,
  label?: string,
) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: "No autenticado" };

  const trimmedLabel = label?.trim();
  if (trimmedLabel && trimmedLabel.length > 40) {
    return { ok: false as const, error: "Etiqueta demasiado larga (máx. 40)" };
  }

  let challenge: WalletChallenge | undefined;
  try {
    [challenge] = await db
      .update(walletChallenges)
      .set({ usedAt: sql`now()` })
      .where(
        and(
          eq(walletChallenges.id, challengeId),
          eq(walletChallenges.userId, user.id),
          isNull(walletChallenges.usedAt),
          gt(walletChallenges.expiresAt, sql`now()`),
        ),
      )
      .returning();
  } catch {
    return { ok: false as const, error: "Desafío inválido o vencido" };
  }
  if (!challenge) {
    return { ok: false as const, error: "Desafío inválido o vencido" };
  }

  let recovered: string;
  try {
    recovered = verifyMessage(challenge.message, signature);
  } catch {
    return { ok: false as const, error: "La firma no corresponde a la wallet" };
  }
  if (getAddress(recovered) !== challenge.address) {
    return { ok: false as const, error: "La firma no corresponde a la wallet" };
  }

  const [linked] = await db
    .insert(wallets)
    .values({
      userId: user.id,
      address: challenge.address,
      label: trimmedLabel || null,
      verifiedAt: new Date(),
    })
    .onConflictDoNothing({ target: [wallets.address, wallets.chainId] })
    .returning();

  if (!linked) {
    const [existing] = await db
      .select({ userId: wallets.userId })
      .from(wallets)
      .where(
        and(
          eq(wallets.address, challenge.address),
          eq(wallets.chainId, FUJI_CHAIN_ID),
        ),
      )
      .limit(1);
    if (existing && existing.userId !== user.id) {
      return {
        ok: false as const,
        error: "Esa wallet ya está vinculada a otra cuenta",
      };
    }
  }

  revalidatePath(WALLETS_PATH);
  return { ok: true as const };
}

export async function listMyWallets() {
  const user = await requireUser();
  return db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, user.id))
    .orderBy(desc(wallets.createdAt));
}

export async function unlinkWallet(id: string) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: "No autenticado" };

  const deleted = await db
    .delete(wallets)
    .where(and(eq(wallets.id, id), eq(wallets.userId, user.id)))
    .returning({ id: wallets.id });
  if (deleted.length === 0) {
    return { ok: false as const, error: "No se encontró la wallet" };
  }

  revalidatePath(WALLETS_PATH);
  return { ok: true as const };
}
