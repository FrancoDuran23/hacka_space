import "server-only";
import { keccak256, toUtf8Bytes } from "ethers";
import type { SatcatRecord } from "./celestrak";
import type { Band, ObjectKind } from "./types";

/**
 * Same rules as contratos/scripts/relayer.ts, so a registration made from the web is audited the same way:
 * the band comes from the apogee, the launch date is anchored to the epoch when it predates 1970
 * (uint64 has no negatives; the raw record keeps the real date), and dataHash is keccak256 of the raw record.
 */
export function registrationTerms(record: SatcatRecord): { band: Band; launchedAt: bigint; dataHash: string } {
  const apogee = Number(record.APOGEE);
  const band: Band = apogee < 600 ? 0 : apogee <= 900 ? 1 : 2;
  const launchedAt = BigInt(Math.max(Math.floor(Date.parse(record.LAUNCH_DATE) / 1000), 1));
  return { band, launchedAt, dataHash: keccak256(toUtf8Bytes(JSON.stringify(record))) };
}

export const OBJECT_KIND: Record<SatcatRecord["OBJECT_TYPE"], ObjectKind> = {
  PAY: "satellite",
  "R/B": "rocket-body",
  DEB: "fragment",
  UNK: "fragment",
};
