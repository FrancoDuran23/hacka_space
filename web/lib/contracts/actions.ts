"use server";

import { and, desc, eq } from "drizzle-orm";
import { getAddress, isAddress } from "ethers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { FUJI_CHAIN_ID } from "@/lib/chain";
import { db } from "@/lib/db";
import {
  authUsers,
  contractAddresses,
  contractKind,
  type ContractAddress,
} from "@/lib/db/schema";

const CONTRACTS_PATH = "/cuenta/contratos";
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = new Set<string>(contractKind.enumValues);

export type ContractActionState = { ok: boolean; error?: string };

export async function addContractAddress(
  formData: FormData,
): Promise<ContractActionState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const deployTxHash = String(formData.get("deployTxHash") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || name.length > 80) {
    return { ok: false, error: "Nombre inválido (máx. 80 caracteres)." };
  }
  if (!KINDS.has(kind)) {
    return { ok: false, error: "Tipo de contrato inválido." };
  }
  if (!isAddress(address)) {
    return { ok: false, error: "Dirección inválida." };
  }
  if (deployTxHash && !TX_HASH_RE.test(deployTxHash)) {
    return { ok: false, error: "Hash de deploy inválido." };
  }
  if (notes.length > 500) {
    return { ok: false, error: "Notas demasiado largas (máx. 500)." };
  }

  try {
    await db.insert(contractAddresses).values({
      name,
      kind: kind as ContractAddress["kind"],
      address: getAddress(address),
      chainId: FUJI_CHAIN_ID,
      deployTxHash: deployTxHash || null,
      notes: notes || null,
      createdBy: user.id,
    });
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      return { ok: false, error: "Esa dirección ya está registrada en Fuji" };
    }
    throw e;
  }

  revalidatePath(CONTRACTS_PATH);
  return { ok: true };
}

export async function listContractAddresses() {
  await requireUser();
  return db
    .select({
      id: contractAddresses.id,
      name: contractAddresses.name,
      kind: contractAddresses.kind,
      address: contractAddresses.address,
      chainId: contractAddresses.chainId,
      deployTxHash: contractAddresses.deployTxHash,
      notes: contractAddresses.notes,
      createdBy: contractAddresses.createdBy,
      createdAt: contractAddresses.createdAt,
      createdByEmail: authUsers.email,
    })
    .from(contractAddresses)
    .leftJoin(authUsers, eq(contractAddresses.createdBy, authUsers.id))
    .orderBy(desc(contractAddresses.createdAt));
}

export type ContractAddressItem = Awaited<
  ReturnType<typeof listContractAddresses>
>[number];

export async function deleteContractAddress(
  id: string,
): Promise<ContractActionState> {
  const user = await requireUser();
  if (!UUID_RE.test(id)) return { ok: false, error: "ID inválido." };

  const deleted = await db
    .delete(contractAddresses)
    .where(
      and(
        eq(contractAddresses.id, id),
        eq(contractAddresses.createdBy, user.id),
      ),
    )
    .returning({ id: contractAddresses.id });

  if (deleted.length === 0) {
    return { ok: false, error: "No existe o no la cargaste vos." };
  }

  revalidatePath(CONTRACTS_PATH);
  return { ok: true };
}
