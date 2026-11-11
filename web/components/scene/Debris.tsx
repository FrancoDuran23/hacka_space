"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three/webgpu";
import { attribute, float, vec4 } from "three/tsl";
import { eciScene, satrecFor } from "@/lib/orbit";
import { formatUSD } from "@/lib/format";
import { STATUS_LABEL, statusAt } from "@/lib/status";
import { app, sim, useApp } from "@/lib/store";
import type { DebrisObject } from "@/lib/types";
import { STATE_RGB, U, createSprites, fxDriven, positions } from "./shared";

const TRAIL_STEPS = 28;
const TRAIL_MINUTES = 13;
const PICK_RADIUS_PX = 18;

/**
 * Every tracked object as a glowing point with a short orbital trail.
 * All points, alert rings and trails are batched: three draw calls regardless of object count.
 */
export function DebrisField() {
  const count = useApp((s) => s.objects.length);
  const { camera, gl, size } = useThree();

  const batch = useMemo(() => {
    const n = Math.max(1, count);
    const dots = createSprites(n, { shape: "glow", attenuate: false });
    const rings = createSprites(n, { shape: "ring", attenuate: false });
    const segs = TRAIL_STEPS - 1;
    const geo = new THREE.BufferGeometry();
    const tp = new Float32Array(n * segs * 2 * 3);
    const tc = new Float32Array(n * segs * 2 * 4);
    geo.setAttribute("position", new THREE.BufferAttribute(tp, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("tint", new THREE.BufferAttribute(tc, 4).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const tint = attribute("tint", "vec4");
    mat.colorNode = vec4(tint.rgb, 1);
    mat.opacityNode = tint.a.mul(U.intro).mul(float(1).sub(U.focus.mul(0.65)));
    const trails = new THREE.LineSegments(geo, mat);
    trails.frustumCulled = false;
    dots.object.renderOrder = 5;
    rings.object.renderOrder = 4;
    return { n, dots, rings, trails, tp, tc, segs, phase: Float32Array.from({ length: n }, () => Math.random() * 6.283), samples: new Float32Array(n * TRAIL_STEPS * 3) };
  }, [count]);

  useEffect(
    () => () => {
      batch.dots.dispose();
      batch.rings.dispose();
      batch.trails.geometry.dispose();
      (batch.trails.material as THREE.Material).dispose();
    },
    [batch],
  );

  // ── picking in screen space (nearest visible point under the cursor)
  const pointer = useRef({ x: -1e4, y: -1e4, downX: 0, downY: 0, inside: false });
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
    const down = (e: PointerEvent) => {
      p.downX = e.clientX;
      p.downY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - p.downX, e.clientY - p.downY) > 5) return;
      const s = app.get();
      if (s.selectedId == null && s.hoveredId != null && s.booted) app.set({ selectedId: s.hoveredId, hoveredId: null, warpTarget: 1 });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.style.cursor = "";
    };
  }, [gl]);

  const tmp = useMemo(() => ({ date: new Date(), v: new THREE.Vector3(), ndc: new THREE.Vector3(), toP: new THREE.Vector3() }), []);
  const frame = useRef(0);

  useFrame(() => {
    const s = app.get();
    const { dots, rings, tp, tc, segs, phase, samples } = batch;
    if (s.objects.length !== batch.n) return;
    const now = performance.now() / 1000;
    const f = frame.current++;
    const warping = sim.speed > 1.5;
    let best = -1;
    let bestD = PICK_RADIUS_PX;
    const p = pointer.current;
    const camPos = camera.position;

    for (let i = 0; i < s.objects.length; i++) {
      const o = s.objects[i];
      const id = o.objectId;
      const st = statusAt(o, sim.time);
      const rec = satrecFor(o.tle);
      let pos = positions.get(id);
      if (!pos) positions.set(id, (pos = new THREE.Vector3(2, 0, 0)));
      const byFx = fxDriven.has(id);
      if (!byFx) {
        tmp.date.setTime(sim.time);
        eciScene(rec, tmp.date, pos);
      }
      const selected = s.selectedId === id;
      const hovered = s.hoveredId === id;
      const shown = st !== "CLEANED" && !byFx;
      const rgb = STATE_RGB[st];

      // pulse: amber breathes slowly, red strobes
      const wave = st === "EXPIRING" ? 0.5 + 0.5 * Math.sin(now * 2.6 + phase[i]) : st === "EXPIRED" ? 0.5 + 0.5 * Math.sin(now * 13 + phase[i]) : 1;
      const gain = (st === "EXPIRED" ? 3.6 : st === "EXPIRING" ? 3.0 : 2.5) * (0.55 + 0.45 * wave) * (hovered ? 1.7 : 1);
      dots.pos.set([pos.x, pos.y, pos.z], i * 3);
      dots.col.set([rgb.r * gain, rgb.g * gain, rgb.b * gain, shown && !selected ? 1 : 0], i * 4);
      dots.size[i] = (selected ? 0.012 : 0.026) * (st === "EXPIRING" ? 0.85 + 0.3 * wave : 1) * (hovered ? 1.45 : 1);

      // expanding alert ring on expired escrows
      const k = (now * 0.9 + phase[i]) % 1;
      rings.pos.set([pos.x, pos.y, pos.z], i * 3);
      rings.col.set([rgb.r * 3, rgb.g * 3, rgb.b * 3, st === "EXPIRED" && shown && !selected ? (1 - k) * (1 - k) : 0], i * 4);
      rings.size[i] = 0.014 + k * 0.05;

      // trail: re-sample a third of the objects per frame (all of them while warping)
      if (warping || (f + i) % 3 === 0) {
        for (let j = 0; j < TRAIL_STEPS; j++) {
          tmp.date.setTime(sim.time - (j / (TRAIL_STEPS - 1)) * TRAIL_MINUTES * 60_000);
          if (eciScene(rec, tmp.date, tmp.v)) samples.set([tmp.v.x, tmp.v.y, tmp.v.z], (i * TRAIL_STEPS + j) * 3);
        }
      }
      const base = i * TRAIL_STEPS * 3;
      samples.set([pos.x, pos.y, pos.z], base);
      const alpha = shown ? (selected ? 0 : 0.8) : 0;
      for (let j = 0; j < segs; j++) {
        const a = base + j * 3;
        const o6 = (i * segs + j) * 6;
        tp[o6] = samples[a];
        tp[o6 + 1] = samples[a + 1];
        tp[o6 + 2] = samples[a + 2];
        tp[o6 + 3] = samples[a + 3];
        tp[o6 + 4] = samples[a + 4];
        tp[o6 + 5] = samples[a + 5];
        const o8 = (i * segs + j) * 8;
        const f0 = Math.pow(1 - j / segs, 1.7) * alpha;
        const f1 = Math.pow(1 - (j + 1) / segs, 1.7) * alpha;
        tc[o8] = tc[o8 + 4] = rgb.r * 1.5;
        tc[o8 + 1] = tc[o8 + 5] = rgb.g * 1.5;
        tc[o8 + 2] = tc[o8 + 6] = rgb.b * 1.5;
        tc[o8 + 3] = f0;
        tc[o8 + 7] = f1;
      }

      // pick candidate: projected distance to the cursor, skipping points hidden behind the planet
      if (p.inside && shown && s.selectedId == null) {
        tmp.ndc.copy(pos).project(camera);
        if (tmp.ndc.z < 1) {
          const sx = (tmp.ndc.x * 0.5 + 0.5) * size.width;
          const sy = (-tmp.ndc.y * 0.5 + 0.5) * size.height;
          const dpx = Math.hypot(sx - p.x, sy - p.y);
          if (dpx < bestD && !behindEarth(camPos, pos, tmp.toP)) {
            bestD = dpx;
            best = id;
          }
        }
      }
    }
    dots.commit();
    rings.commit();
    batch.trails.geometry.getAttribute("position").needsUpdate = true;
    batch.trails.geometry.getAttribute("tint").needsUpdate = true;

    const next = best === -1 ? null : best;
    if (next !== s.hoveredId && s.selectedId == null) {
      app.set({ hoveredId: next });
      gl.domElement.style.cursor = next == null ? "" : "pointer";
    }
  });

  return (
    <group>
      <primitive object={batch.trails} />
      <primitive object={batch.rings.object} />
      <primitive object={batch.dots.object} />
      <HoverCard />
    </group>
  );
}

/** True when the segment camera → point crosses the unit sphere. */
function behindEarth(cam: THREE.Vector3, p: THREE.Vector3, d: THREE.Vector3): boolean {
  d.copy(p).sub(cam);
  const len = d.length();
  d.divideScalar(len);
  const b = cam.dot(d);
  const c = cam.lengthSq() - 1;
  const disc = b * b - c;
  if (disc < 0) return false;
  const t = -b - Math.sqrt(disc);
  return t > 0 && t < len;
}

function HoverCard() {
  const o = useApp((s) => (s.hoveredId == null ? null : (s.objects.find((x) => x.objectId === s.hoveredId) ?? null)));
  const anchor = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!o || !anchor.current) return;
    const p = positions.get(o.objectId);
    if (p) anchor.current.position.copy(p);
  });
  if (!o) return null;
  return (
    <group ref={anchor}>
      <Html zIndexRange={[40, 30]} style={{ pointerEvents: "none" }}>
        <Card o={o} />
      </Html>
    </group>
  );
}

function Card({ o }: { o: DebrisObject }) {
  const st = statusAt(o, sim.time);
  return (
    <div className="holo-card" data-status={st}>
      <div className="holo-card__head">
        <span className="holo-card__dot" />
        <span className="truncate">{o.name}</span>
        <span className="mono ml-auto text-[10.5px] font-normal text-faint">#{o.objectId}</span>
      </div>
      <dl className="holo-card__grid">
        <dt>Owner</dt>
        <dd>
          {o.owner} · {o.country}
        </dd>
        <dt>Locked</dt>
        <dd>{formatUSD(st === "EXPIRED" ? 0 : o.locked)}</dd>
        <dt>Status</dt>
        <dd className="holo-card__status">{STATUS_LABEL[st]}</dd>
      </dl>
    </div>
  );
}
