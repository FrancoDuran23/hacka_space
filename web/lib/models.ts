import type { DebrisObject } from "./types";

/** Real spacecraft models (public/assets/modelos-3d) matched to each tracked object. */
const MODELS = {
  radarsat: "/assets/modelos-3d/radarsat-1.glb",
  sacc: "/assets/modelos-3d/sac-c.glb",
  tdrs: "/assets/modelos-3d/tdrs-a.glb",
  agena: "/assets/modelos-3d/agena-stage.glb",
  landsat: "/assets/modelos-3d/landsat.glb",
  acrimsat: "/assets/modelos-3d/acrimsat.glb",
} as const;

/** Satellite-kit pieces — a detached panel / bus / dish reads as a real fragment. */
const FRAG_MODELS = ["/assets/modelos-3d/frag-panel.glb", "/assets/modelos-3d/frag-bus.glb", "/assets/modelos-3d/frag-dish.glb"] as const;

/** Model closest to the real object: radar sats, comm sats, stages, fragments. */
export function modelForObject(o: Pick<DebrisObject, "name" | "kind" | "objectId">): string {
  const n = o.name.toUpperCase();
  if (o.kind === "rocket-body") return MODELS.agena;
  if (o.kind === "fragment") return FRAG_MODELS[o.objectId % FRAG_MODELS.length];
  if (/ENVISAT|SEASAT/.test(n)) return MODELS.radarsat;
  if (/SAOCOM/.test(n)) return MODELS.sacc;
  if (/IRIDIUM|COSMOS/.test(n)) return MODELS.tdrs;
  return o.objectId % 2 ? MODELS.landsat : MODELS.acrimsat;
}

/** Every model, for preloading. */
export const ALL_MODELS = [...Object.values(MODELS), ...FRAG_MODELS];
