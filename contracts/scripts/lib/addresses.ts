// Derivación determinística de direcciones para la demo de OrbitClear.
//
// - Owners y limpiadores: direcciones PÚBLICAS de referencia, sin clave privada.
//   Cualquiera puede recalcularlas: getAddress(dataSlice(keccak256(utf8(prefix + name)), 12)).
// - Financiadores: wallets reales derivadas en secreto de la clave del deployer, para que
//   el seed pueda firmar en su nombre. La clave del deployer nunca sale de .env.
import { Wallet, concat, dataSlice, getAddress, getBytes, keccak256, toUtf8Bytes, type Provider } from "ethers";

export const OWNER_PREFIX = "orbitclear:owner:";
export const CLEANER_PREFIX = "orbitclear:cleaner:";
export const FUNDER_PREFIX = "orbitclear:funder:";

/** Descripción corta de la derivación, para dejarla escrita en el JSON de la web. */
export const ADDRESS_DERIVATION = {
  owner: `getAddress(dataSlice(keccak256(toUtf8Bytes("${OWNER_PREFIX}" + name)), 12))`,
  cleaner: `getAddress(dataSlice(keccak256(toUtf8Bytes("${CLEANER_PREFIX}" + name)), 12))`,
  funder: `new Wallet(keccak256(concat([deployerPrivateKey, toUtf8Bytes("${FUNDER_PREFIX}" + name)]))) (secreto, solo el seed)`,
} as const;

function publicPlaceholder(prefix: string, name: string): string {
  return getAddress(dataSlice(keccak256(toUtf8Bytes(prefix + name)), 12));
}

export function ownerAddress(name: string): string {
  return publicPlaceholder(OWNER_PREFIX, name);
}

export function cleanerAddress(name: string): string {
  return publicPlaceholder(CLEANER_PREFIX, name);
}

export function funderWallet(deployerPrivateKey: string, name: string, provider?: Provider): Wallet {
  const key = keccak256(concat([getBytes(deployerPrivateKey), toUtf8Bytes(FUNDER_PREFIX + name)]));
  return new Wallet(key, provider ?? null);
}
