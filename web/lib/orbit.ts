import { twoline2satrec, propagate, gstime, sunPos, jday, type SatRec } from "./sgp4";

export const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2

const cache = new Map<string, SatRec>();

export function satrecFor(tle: readonly [string, string]): SatRec {
  const key = tle[0];
  let rec = cache.get(key);
  if (!rec) {
    rec = twoline2satrec(tle[0], tle[1]);
    cache.set(key, rec);
  }
  return rec;
}

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): unknown;
}

/**
 * Inertial (TEME ≈ ECI) position in scene units (1 = Earth radius), Y up = celestial north.
 * Scene mapping: (x, z, −y). The Earth mesh is rotated by GMST so this lines up with the texture.
 */
export function eciScene(rec: SatRec, date: Date, out: Vec3Like): boolean {
  const pv = propagate(rec, date);
  if (!pv) return false;
  const p = pv.position;
  out.set(p.x / EARTH_RADIUS_KM, p.z / EARTH_RADIUS_KM, -p.y / EARTH_RADIUS_KM);
  return true;
}

export function gmstAt(date: Date): number {
  return gstime(date);
}

/** Unit vector toward the Sun in scene coordinates. */
export function sunDirection(date: Date): [number, number, number] {
  const jd = jday(date);
  const { rsun } = sunPos(jd);
  const l = Math.hypot(rsun.x, rsun.y, rsun.z) || 1;
  return [rsun.x / l, rsun.z / l, -rsun.y / l];
}

/** Earth-fixed lat/lon (deg) → local scene position on a sphere of radius r (matches SphereGeometry UVs). */
export function latLonToLocal(latDeg: number, lonDeg: number, r = 1): [number, number, number] {
  const la = (latDeg * Math.PI) / 180;
  const lo = (lonDeg * Math.PI) / 180;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
}

export interface Telemetry {
  altitudeKm: number;
  speedKms: number;
}

export function telemetry(rec: SatRec, date: Date): Telemetry | null {
  const pv = propagate(rec, date);
  if (!pv) return null;
  const { position: p, velocity: v } = pv;
  return {
    altitudeKm: Math.hypot(p.x, p.y, p.z) - EARTH_RADIUS_KM,
    speedKms: Math.hypot(v.x, v.y, v.z),
  };
}

/** Orbital period in minutes (from mean motion). */
export function periodMinutes(rec: SatRec): number {
  return (2 * Math.PI) / rec.no;
}

export function perigeeApogeeKm(rec: SatRec): { perigee: number; apogee: number } {
  const n = rec.no / 60; // rad/s
  const a = Math.cbrt(MU / (n * n));
  return { perigee: a * (1 - rec.ecco) - EARTH_RADIUS_KM, apogee: a * (1 + rec.ecco) - EARTH_RADIUS_KM };
}
