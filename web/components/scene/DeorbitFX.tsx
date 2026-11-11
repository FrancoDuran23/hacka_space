"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { settleDeorbit } from "@/lib/actions";
import { eciScene, satrecFor } from "@/lib/orbit";
import { app, sim } from "@/lib/store";
import { U, clamp01, createSprites, fxDriven, positions } from "./shared";

const FALL_SECONDS = 5.2;
const SPARKS = 900;
const MAX_FALLS = 4;

interface Fall {
  t0: number;
  origin: THREE.Vector3;
  axis: THREE.Vector3;
  r0: number;
  burnedAt: number | null;
}

/**
 * DEORBIT: flash, a decaying spiral into the atmosphere with a trail of fire, then the object
 * breaks up into sparks. While the oracle is still verifying, a targeting reticle locks on.
 */
export function DeorbitFX() {
  const fx = useMemo(() => {
    const sparks = createSprites(SPARKS, { shape: "glow", attenuate: true });
    const heads = createSprites(MAX_FALLS * 2, { shape: "glow", attenuate: true });
    const reticles = createSprites(MAX_FALLS, { shape: "ring", attenuate: false });
    sparks.object.renderOrder = 8;
    heads.object.renderOrder = 9;
    reticles.object.renderOrder = 9;
    return {
      sparks,
      heads,
      reticles,
      vel: new Float32Array(SPARKS * 3),
      life: new Float32Array(SPARKS),
      ttl: new Float32Array(SPARKS),
      base: new Float32Array(SPARKS * 4), // rgb + size
      cursor: 0,
    };
  }, []);
  useEffect(
    () => () => {
      fx.sparks.dispose();
      fx.heads.dispose();
      fx.reticles.dispose();
    },
    [fx],
  );

  const falls = useRef(new Map<number, Fall>());
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), tan: new THREE.Vector3(), rad: new THREE.Vector3(), rnd: new THREE.Vector3(), next: new THREE.Vector3(), date: new Date() }), []);

  const emit = (p: THREE.Vector3, v: THREE.Vector3, ttl: number, r: number, g: number, b: number, size: number) => {
    const i = fx.cursor;
    fx.cursor = (i + 1) % SPARKS;
    fx.sparks.pos.set([p.x, p.y, p.z], i * 3);
    fx.vel.set([v.x, v.y, v.z], i * 3);
    fx.life[i] = fx.ttl[i] = ttl;
    fx.base.set([r, g, b, size], i * 4);
  };
  const randomUnit = (out: THREE.Vector3) => out.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

  useFrame((_, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    const now = performance.now() / 1000;
    const s = app.get();
    const { heads, reticles, sparks } = fx;
    for (let i = 0; i < heads.count; i++) heads.col[i * 4 + 3] = 0;
    for (let i = 0; i < reticles.count; i++) reticles.col[i * 4 + 3] = 0;

    let slot = 0;
    let action = 0;
    for (const key in s.runs) {
      const id = Number(key);
      const run = s.runs[id];
      const pos = positions.get(id);
      if (!pos || slot >= MAX_FALLS) continue;

      if (run.phase === "verifying") {
        const k = (now * 1.4) % 1;
        reticles.pos.set([pos.x, pos.y, pos.z], slot * 3);
        reticles.col.set([0.4, 2.6, 3.0, 0.35 + 0.65 * (1 - k)], slot * 4);
        reticles.size[slot] = 0.085 - 0.045 * k;
        slot++;
        continue;
      }
      if (run.phase !== "falling" && run.phase !== "burned") continue;

      let fall = falls.current.get(id);
      if (!fall) {
        if (run.phase === "burned") continue; // settled before this component saw it
        const o = s.objects.find((x) => x.objectId === id);
        if (!o) continue;
        // orbital plane from two SGP4 samples a few seconds apart
        tmp.date.setTime(sim.time + 8000);
        eciScene(satrecFor(o.tle), tmp.date, tmp.next);
        const axis = new THREE.Vector3().crossVectors(pos, tmp.next).normalize();
        fall = { t0: now, origin: pos.clone(), axis, r0: pos.length(), burnedAt: null };
        falls.current.set(id, fall);
        fxDriven.add(id);
      }

      const tau = (now - fall.t0) / FALL_SECONDS;
      if (fall.burnedAt == null || now - fall.burnedAt < 2) action = 1;
      const h = slot * 2;
      if (tau < 1) {
        const angle = 1.15 * (0.55 * tau + 0.45 * tau * tau);
        const r = fall.r0 - (fall.r0 - 1.004) * Math.pow(tau, 2.3);
        pos.copy(fall.origin).applyAxisAngle(fall.axis, angle).setLength(r);
        tmp.tan.crossVectors(fall.axis, pos).normalize();
        tmp.rad.copy(pos).normalize();
        const heat = clamp01((tau - 0.12) / 0.7);

        // plasma head
        heads.pos.set([pos.x, pos.y, pos.z], h * 3);
        const gain = 2.5 + 3.5 * heat;
        heads.col.set([1.0 * gain, (0.42 + 0.3 * heat) * gain, (0.1 + 0.3 * heat) * gain, 0.3 + 0.6 * heat], h * 4);
        heads.size[h] = 0.008 + 0.02 * heat;
        // ignition flash
        const flash = clamp01(1 - (now - fall.t0) / 0.5);
        heads.pos.set([pos.x, pos.y, pos.z], (h + 1) * 3);
        heads.col.set([4, 6, 7, flash * flash * 0.8], (h + 1) * 4);
        heads.size[h + 1] = 0.02 + 0.09 * (1 - flash);

        // fire trail
        const n = 2 + Math.round(7 * heat);
        for (let j = 0; j < n; j++) {
          randomUnit(tmp.rnd);
          tmp.p.copy(pos).addScaledVector(tmp.rnd, 0.0015 + 0.003 * heat).addScaledVector(tmp.tan, -Math.random() * 0.006);
          tmp.rnd.multiplyScalar(0.006 + 0.012 * heat).addScaledVector(tmp.tan, -(0.015 + 0.05 * Math.random())).addScaledVector(tmp.rad, 0.008 * Math.random());
          const hot = Math.random();
          emit(tmp.p, tmp.rnd, 0.45 + Math.random() * 0.9, 4.5 + 2 * hot, 1.2 + 2.6 * hot * heat, 0.25 + 1.2 * hot * heat, 0.0018 + 0.0042 * Math.random() * (0.4 + heat));
        }
      } else {
        if (fall.burnedAt == null) {
          fall.burnedAt = now;
          tmp.rad.copy(pos).normalize();
          for (let j = 0; j < 260; j++) {
            randomUnit(tmp.rnd).addScaledVector(tmp.rad, 0.7).normalize();
            const speed = 0.015 + 0.16 * Math.pow(Math.random(), 2);
            tmp.rnd.multiplyScalar(speed);
            const hot = Math.random();
            emit(pos, tmp.rnd, 0.6 + Math.random() * 1.5, 5 + 3 * hot, 1.6 + 3.4 * hot, 0.3 + 2.4 * hot, 0.002 + 0.006 * Math.random());
          }
          settleDeorbit(id);
        }
        const after = now - fall.burnedAt;
        const flash = clamp01(1 - after / 0.7);
        heads.pos.set([pos.x, pos.y, pos.z], h * 3);
        heads.col.set([7, 4.5, 2.5, flash * flash * 0.9], h * 4);
        heads.size[h] = 0.02 + 0.06 * (1 - flash);
        // release the object back to SGP4 once nobody is looking at the wreck
        if (after > 2.5 && s.selectedId !== id) {
          fxDriven.delete(id);
          falls.current.delete(id);
        }
      }
      slot++;
    }

    // pull focus: the background sharpens while something is burning up
    U.sharp.value += (action - U.sharp.value) * (1 - Math.exp(-dt * 3));

    // integrate sparks
    for (let i = 0; i < SPARKS; i++) {
      const life = fx.life[i];
      const c = i * 4;
      if (life <= 0) {
        sparks.col[c + 3] = 0;
        continue;
      }
      fx.life[i] = life - dt;
      const p = i * 3;
      sparks.pos[p] += fx.vel[p] * dt;
      sparks.pos[p + 1] += fx.vel[p + 1] * dt;
      sparks.pos[p + 2] += fx.vel[p + 2] * dt;
      const drag = 1 - dt * 1.2;
      fx.vel[p] *= drag;
      fx.vel[p + 1] *= drag;
      fx.vel[p + 2] *= drag;
      const k = clamp01(life / fx.ttl[i]);
      // cool down: white-hot → orange → deep red
      sparks.col[c] = fx.base[c];
      sparks.col[c + 1] = fx.base[c + 1] * k;
      sparks.col[c + 2] = fx.base[c + 2] * k * k;
      sparks.col[c + 3] = Math.pow(k, 1.4);
      sparks.size[i] = fx.base[c + 3] * (0.45 + 0.55 * k);
    }
    sparks.commit();
    heads.commit();
    reticles.commit();
  });

  return (
    <group>
      <primitive object={fx.sparks.object} />
      <primitive object={fx.heads.object} />
      <primitive object={fx.reticles.object} />
    </group>
  );
}
