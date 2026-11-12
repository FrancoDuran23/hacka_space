/**
 * CelesTrak OMM (JSON) → two-line elements. Since catalog numbers passed 99999 (2026-07-11) CelesTrak no
 * longer serves TLE for new objects; OMM carries the same mean elements, and TLE's Alpha-5 scheme encodes
 * catalog numbers up to 339999 (first digit pair as a letter, skipping I and O).
 */
export interface Omm {
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

const ALPHA5 = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function alpha5(norad: number): string {
  if (norad < 100_000) return String(norad).padStart(5, "0");
  const lead = Math.floor(norad / 10_000) - 10;
  if (lead >= ALPHA5.length) throw new Error(`NORAD ${norad} no entra en el formato Alpha-5`);
  return ALPHA5[lead] + String(norad % 10_000).padStart(4, "0");
}

function checksum(line: string): number {
  let sum = 0;
  for (const ch of line) {
    if (ch >= "0" && ch <= "9") sum += Number(ch);
    else if (ch === "-") sum += 1;
  }
  return sum % 10;
}

/** TLE "assumed decimal point" exponent field, e.g. -6.3631e-5 → "-63631-4". */
function expField(v: number): string {
  if (v === 0) return " 00000+0";
  let e = Math.floor(Math.log10(Math.abs(v))) + 1;
  let digits = Math.round((Math.abs(v) / 10 ** e) * 1e5);
  if (digits >= 100_000) {
    digits = Math.round(digits / 10);
    e += 1;
  }
  return `${v < 0 ? "-" : " "}${String(digits).padStart(5, "0")}${e < 0 ? "-" : "+"}${Math.abs(e)}`;
}

function epochField(iso: string): string {
  const t = Date.parse(iso.endsWith("Z") ? iso : `${iso}Z`);
  const d = new Date(t);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const day = 1 + (t - start) / 86_400_000;
  return `${String(d.getUTCFullYear() % 100).padStart(2, "0")}${day.toFixed(8).padStart(12, "0")}`;
}

function intlDesignator(objectId: string): string {
  const m = /^(\d{4})-(\d{3})([A-Z]{1,3})$/.exec(objectId);
  return (m ? `${m[1].slice(2)}${m[2]}${m[3]}` : "").padEnd(8, " ");
}

const angle = (v: number) => v.toFixed(4).padStart(8, " ");

export function ommToTle(o: Omm): [string, string] {
  const num = alpha5(o.NORAD_CAT_ID);
  const ndot = `${o.MEAN_MOTION_DOT < 0 ? "-" : " "}${Math.abs(o.MEAN_MOTION_DOT).toFixed(8).slice(1)}`;
  const l1 = [
    "1",
    `${num}${o.CLASSIFICATION_TYPE || "U"}`,
    intlDesignator(o.OBJECT_ID),
    epochField(o.EPOCH),
    ndot,
    expField(o.MEAN_MOTION_DDOT),
    expField(o.BSTAR),
    String(o.EPHEMERIS_TYPE ?? 0),
    String(o.ELEMENT_SET_NO % 10_000).padStart(4, " "),
  ].join(" ");
  const ecc = String(Math.round(o.ECCENTRICITY * 1e7)).padStart(7, "0");
  const l2 = [
    "2",
    num,
    angle(o.INCLINATION),
    angle(o.RA_OF_ASC_NODE),
    ecc,
    angle(o.ARG_OF_PERICENTER),
    angle(o.MEAN_ANOMALY),
    `${o.MEAN_MOTION.toFixed(8).padStart(11, " ")}${String(o.REV_AT_EPOCH % 100_000).padStart(5, " ")}`,
  ].join(" ");
  return [l1 + checksum(l1), l2 + checksum(l2)];
}
