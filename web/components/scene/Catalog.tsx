"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three/webgpu";
import { eciScene, satrecFor, telemetry, tleFields } from "@/lib/orbit";
import { ownerLabel } from "@/lib/owners";
import { utcDate, utcClock } from "@/lib/format";
import { app, sim, useApp, useSimTime } from "@/lib/store";
import type { CatalogKind, CatalogObject } from "@/lib/types";
import { behindEarth, createSprites, positions } from "./shared";

const PICK_RADIUS_PX = 13;
/** SATCAT status colors, dimmer than escrow objects: context, not the product. */
const KIND_RGB: Record<CatalogKind, [number, number, number]> = {
  active: [0.5, 0.95, 1.15],
  debris: [1.2, 0.5, 0.35],
  out: [0.45, 0.45, 0.5],
};

/**
 * Live CelesTrak group as a cloud of small points orbiting in real time.
 * One draw call; SGP4 propagation per frame like DebrisField. Hover shows the
 * satellite's name, NORAD id and propagated telemetry.
 */
export function CatalogField() {
  const catalog = useApp((s) => s.catalog);
  const escrows = useApp((s) => s.objects);
  const { camera, gl, size } = useThree();

  // ids already glowing as escrows keep their own (brighter) representation
  const items = useMemo(() => {
    const ids = new Set(escrows.map((o) => o.objectId));
    return catalog.filter((o) => !ids.has(o.objectId));
  }, [catalog, escrows]);

  const batch = useMemo(() => createSprites(Math.max(1, items.length), { shape: "glow", attenuate: false, dimOnFocus: 0.9 }), [items.length]);

  useEffect(() => () => batch.dispose(), [batch]);

  const pointer = useRef({ x: -1e4, y: -1e4, inside: false });
  useEffect(() => {
    const el = gl.domElement;
    const p = pointer.current;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      p.x = e.clientX - r.left;
      p.y = e.clientY - r.top;
      p.inside = true;
    };
    const leave = () => {
      p.inside = false;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [gl]);

  const tmp = useMemo(() => ({ date: new Date(), v: new THREE.Vector3(), ndc: new THREE.Vector3(), toP: new THREE.Vector3() }), []);

  useFrame(() => {
    const s = app.get();
    if (items.length !== batch.count) return;
    const p = pointer.current;
    const camPos = camera.position;
    let best = -1;
    let bestD = PICK_RADIUS_PX;
    const canPick = p.inside && s.selectedId == null && s.hoveredId == null;

    for (let i = 0; i < items.length; i++) {
      const o = items[i];
      let pos = positions.get(o.objectId);
      if (!pos) positions.set(o.objectId, (pos = new THREE.Vector3(2, 0, 0)));
      tmp.date.setTime(sim.time);
      let alive = true;
      try {
        alive = eciScene(satrecFor(o.tle), tmp.date, pos);
      } catch {
        alive = false; // bad element set: hide it instead of killing the layer
      }
      if (!alive) pos.set(2, 0, 0);
      const hovered = s.hoveredCatalog === o.objectId;
      const [r, g, b] = KIND_RGB[o.kind ?? "debris"];
      const boost = hovered ? 2.4 : 1.1;
      batch.pos.set([pos.x, pos.y, pos.z], i * 3);
      batch.col.set([r * boost, g * boost, b * boost, !alive ? 0 : hovered ? 0.95 : 0.5], i * 4);
      batch.size[i] = hovered ? 0.02 : 0.013;

      if (canPick) {
        tmp.ndc.copy(pos).project(camera);
        if (tmp.ndc.z < 1) {
          const sx = (tmp.ndc.x * 0.5 + 0.5) * size.width;
          const sy = (-tmp.ndc.y * 0.5 + 0.5) * size.height;
          const dpx = Math.hypot(sx - p.x, sy - p.y);
          if (dpx < bestD && !behindEarth(camPos, pos, tmp.toP)) {
            bestD = dpx;
            best = o.objectId;
          }
        }
      }
    }
    batch.commit();

    const next = best === -1 ? null : best;
    if (next !== s.hoveredCatalog) {
      app.set({ hoveredCatalog: next });
      if (s.hoveredId == null) gl.domElement.style.cursor = next == null ? "" : "pointer";
    }
  });

  return (
    <group>
      <primitive object={batch.object} />
      <CatalogHover items={items} />
    </group>
  );
}

function CatalogHover({ items }: { items: CatalogObject[] }) {
  const o = useApp((s) => (s.hoveredCatalog == null ? null : (items.find((x) => x.objectId === s.hoveredCatalog) ?? null)));
  const anchor = useRef<THREE.Group>(null);
  const tick = useSimTime();
  useFrame(() => {
    if (!o || !anchor.current) return;
    const p = positions.get(o.objectId);
    if (p) anchor.current.position.copy(p);
  });
  if (!o) return null;
  return (
    <group ref={anchor}>
      <Html zIndexRange={[40, 30]} style={{ pointerEvents: "none" }}>
        <Card o={o} now={tick || Date.now()} />
      </Html>
    </group>
  );
}

const KIND_LABEL: Record<CatalogKind, string> = { active: "Activo", debris: "Basura espacial", out: "Fuera de órbita" };
const TYPE_LABEL: Record<string, string> = { PAY: "satélite", "R/B": "etapa de cohete", DEB: "fragmento", UNK: "desconocido" };

function Card({ o, now }: { o: CatalogObject; now: number }) {
  let tm = null;
  let f = null;
  try {
    tm = telemetry(satrecFor(o.tle), new Date(now));
    f = tleFields(o.tle);
  } catch {
    /* malformed tle */
  }
  return (
    <div className="holo-card">
      <div className="holo-card__head">
        <span className="holo-card__dot" />
        <span className="truncate">{o.name}</span>
        <span className="mono ml-auto text-[10.5px] font-normal text-faint">#{o.objectId}</span>
      </div>
      <dl className="holo-card__grid">
        <dt>Status</dt>
        <dd>
          {KIND_LABEL[o.kind ?? "debris"]}
          {o.objectType ? ` · ${TYPE_LABEL[o.objectType] ?? o.objectType}` : ""}
        </dd>
        <dt>Responsable</dt>
        <dd>{ownerLabel(o.owner)}</dd>
        <dt>Launched</dt>
        <dd>{o.launchDate ? utcDate(Date.parse(o.launchDate + "T00:00:00Z")) : "—"}</dd>
        <dt>Size (RCS)</dt>
        <dd>{o.rcs != null ? `${o.rcs.toFixed(2)} m²` : "—"}</dd>
        <dt>Intl. des.</dt>
        <dd>{o.intlDes || "—"}</dd>
        <dt>Source</dt>
        <dd>CelesTrak GP+SATCAT · live TLE</dd>
        <dt>Altitude</dt>
        <dd>{tm ? `${tm.altitudeKm.toFixed(0)} km` : "—"}</dd>
        <dt>Velocity</dt>
        <dd>{tm ? `${tm.speedKms.toFixed(2)} km/s` : "—"}</dd>
        <dt>Inclination</dt>
        <dd>{f ? `${f.inclinationDeg.toFixed(2)}°` : "—"}</dd>
        <dt>TLE epoch</dt>
        <dd>{f?.epochISO ? `${utcDate(Date.parse(f.epochISO))} ${utcClock(Date.parse(f.epochISO)).slice(0, 5)}` : "—"}</dd>
      </dl>
    </div>
  );
}
