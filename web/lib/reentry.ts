import "server-only";
import { twoline2satrec, propagate } from "./sgp4";
import { keccak256, toUtf8Bytes } from "ethers";
import { EARTH_RADIUS_KM, perigeeApogeeKm } from "./orbit";

const MU = 398600.4418;
export const REENTRY_THRESHOLD_KM = 120;

function tleChecksum(line: string): number {
  let sum = 0;
  for (const ch of line.slice(0, 68)) {
    if (ch >= "0" && ch <= "9") sum += Number(ch);
    else if (ch === "-") sum += 1;
  }
  return sum % 10;
}

/**
 * Simulated tracking update after the operator's deorbit burn:
 * same apogee, perigee pushed down to `targetPerigeeKm`. Returns a valid TLE line 2.
 */
export function postBurnLine2(l2: string, apogeeKm: number, targetPerigeeKm: number): string {
  const ra = apogeeKm + EARTH_RADIUS_KM;
  const rp = targetPerigeeKm + EARTH_RADIUS_KM;
  const a = (ra + rp) / 2;
  const e = (ra - rp) / (ra + rp);
  const nRevDay = (Math.sqrt(MU / a ** 3) * 86400) / (2 * Math.PI);
  const ecc = Math.round(e * 1e7).toString().padStart(7, "0").slice(0, 7);
  const mm = nRevDay.toFixed(8).padStart(11, " ");
  const body = (l2.slice(0, 26) + ecc + l2.slice(33, 52) + mm + l2.slice(63, 68)).padEnd(68, " ").slice(0, 68);
  return body + tleChecksum(body);
}

export interface Verification {
  reentered: boolean;
  perigeeBeforeKm: number;
  perigeeAfterKm: number;
  minAltitudeKm: number;
  trackedTle: [string, string];
  evidenceHash: string;
}

/** Verifies with SGP4 that the (post-burn) tracked orbit dips below the reentry threshold. */
export function verifyReentry(tle: [string, string], at = new Date()): Verification {
  const before = twoline2satrec(tle[0], tle[1]);
  const { perigee, apogee } = perigeeApogeeKm(before);
  const l2 = postBurnLine2(tle[1], apogee, 65);
  const after = twoline2satrec(tle[0], l2);
  const periodMin = (2 * Math.PI) / after.no;
  let minAlt = Infinity;
  for (let i = 0; i <= 180; i++) {
    const pv = propagate(after, new Date(at.getTime() + (i / 180) * periodMin * 60_000));
    if (!pv) {
      minAlt = 0; // SGP4 flags the object as decayed
      break;
    }
    const p = pv.position;
    minAlt = Math.min(minAlt, Math.hypot(p.x, p.y, p.z) - EARTH_RADIUS_KM);
  }
  const evidenceHash = keccak256(toUtf8Bytes(`${tle[0]}\n${l2}\n${at.toISOString()}`));
  return {
    reentered: minAlt < REENTRY_THRESHOLD_KM,
    perigeeBeforeKm: Math.round(perigee),
    perigeeAfterKm: Math.round(perigeeApogeeKm(after).perigee),
    minAltitudeKm: Math.round(minAlt),
    trackedTle: [tle[0], l2],
    evidenceHash,
  };
}
