"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { gmstAt, latLonToLocal } from "@/lib/orbit";
import { app, sim } from "@/lib/store";
import { U, easeInOutCubic, positions } from "./shared";

const R_MIN = 1.7;
const R_MAX = 8;
const FLY_SECONDS = 1.35;

/** Camera: free orbit around the globe, smooth fly-to a selected object, then orbit around it. */
export function Rig() {
  const { camera, gl, size } = useThree();
  const s = useRef({
    theta: 0,
    phi: 1.25,
    r: 5.4,
    vTheta: 0,
    vPhi: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    idle: 0,
    // detail orbit
    ang: 0.6,
    elev: 0.5,
    dist: 0.15,
    // transition
    mode: "globe" as "globe" | "detail",
    targetId: null as number | null,
    k: 0, // 0 globe … 1 detail
    from: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    t: 1, // 0..1 progress of current flight
    shift: 0.15,
    init: false,
  });
  const v = useMemo(
    () => ({
      globe: new THREE.Vector3(),
      detail: new THREE.Vector3(),
      look: new THREE.Vector3(),
      radial: new THREE.Vector3(),
      t1: new THREE.Vector3(),
      t2: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      qi: new THREE.Quaternion(),
      up: new THREE.Vector3(),
      Y: new THREE.Vector3(0, 1, 0),
      lastTarget: new THREE.Vector3(1.1, 0, 0),
    }),
    [],
  );

  useEffect(() => {
    const el = gl.domElement;
    const st = s.current;
    const down = (e: PointerEvent) => {
      st.dragging = true;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      st.idle = 0;
    };
    const move = (e: PointerEvent) => {
      if (!st.dragging) return;
      const dx = e.clientX - st.lastX;
      const dy = e.clientY - st.lastY;
      st.lastX = e.clientX;
      st.lastY = e.clientY;
      if (st.mode === "detail") {
        st.ang -= dx * 0.008;
        st.elev = Math.min(1.3, Math.max(-0.4, st.elev + dy * 0.006));
      } else {
        const k = 0.0016 * st.r;
        st.vTheta = -dx * k;
        st.vPhi = -dy * k;
        st.theta += st.vTheta;
        st.phi = Math.min(Math.PI - 0.25, Math.max(0.25, st.phi + st.vPhi));
      }
    };
    const up = () => {
      st.dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const f = Math.exp(e.deltaY * 0.0011);
      if (st.mode === "detail") st.dist = Math.min(0.45, Math.max(0.05, st.dist * f));
      else st.r = Math.min(R_MAX, Math.max(R_MIN, st.r * f));
      st.idle = 0;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const st = s.current;
    const dt = Math.min(0.05, rawDt);
    const cam = camera as THREE.PerspectiveCamera;

    if (!st.init) {
      // open on the Atlantic side of South America: Salta in view, night side to the east
      const g = gmstAt(new Date(sim.time));
      const [x, y, z] = latLonToLocal(-18, -38, 1);
      const wx = x * Math.cos(g) + z * Math.sin(g);
      const wz = -x * Math.sin(g) + z * Math.cos(g);
      st.theta = Math.atan2(wx, wz);
      st.phi = Math.acos(y);
      st.init = true;
    }

    // ── react to selection changes
    const sel = app.get().selectedId;
    if (sel !== st.targetId) {
      st.from.copy(cam.position);
      st.fromLook.copy(st.mode === "detail" || st.k > 0 ? v.look : v.a.set(0, 0, 0));
      st.t = 0;
      if (sel != null) {
        st.mode = "detail";
        st.dist = 0.15;
        st.elev = 0.5;
      } else {
        st.mode = "globe";
        // come back straight up from wherever we are
        const d = v.a.copy(cam.position).normalize();
        st.theta = Math.atan2(d.x, d.z);
        st.phi = Math.acos(Math.min(1, Math.max(-1, d.y)));
        st.vTheta = st.vPhi = 0;
      }
      st.targetId = sel;
    }

    // ── globe pose
    if (st.mode === "globe" && !st.dragging) {
      st.idle += dt;
      st.theta += st.vTheta;
      st.phi = Math.min(Math.PI - 0.25, Math.max(0.25, st.phi + st.vPhi));
      st.vTheta *= 0.92;
      st.vPhi *= 0.92;
      if (st.idle > 2.5) st.theta += dt * 0.012;
    }
    const sp = Math.sin(st.phi);
    v.globe.set(st.r * sp * Math.sin(st.theta), st.r * Math.cos(st.phi), st.r * sp * Math.cos(st.theta));

    // ── detail pose (orbiting the target)
    const tp = st.targetId != null ? positions.get(st.targetId) : null;
    if (tp) v.lastTarget.copy(tp);
    const target = v.lastTarget;
    if (st.mode === "detail" && !st.dragging) st.ang += dt * 0.22;
    v.radial.copy(target).normalize();
    v.t1.crossVectors(v.Y, v.radial);
    if (v.t1.lengthSq() < 1e-6) v.t1.set(1, 0, 0);
    v.t1.normalize();
    v.t2.crossVectors(v.radial, v.t1).normalize();
    const ce = Math.cos(st.elev);
    v.detail
      .copy(v.radial)
      .multiplyScalar(Math.sin(st.elev))
      .addScaledVector(v.t1, Math.cos(st.ang) * ce)
      .addScaledVector(v.t2, Math.sin(st.ang) * ce)
      .multiplyScalar(st.dist)
      .add(target);

    // ── flight
    if (st.t < 1) st.t = Math.min(1, st.t + dt / FLY_SECONDS);
    const e = easeInOutCubic(st.t);
    const to = st.mode === "detail" ? v.detail : v.globe;
    const toLook = st.mode === "detail" ? target : v.b.set(0, 0, 0);
    if (st.t < 1) {
      // sweep around the planet instead of cutting through it: slerp direction, lerp radius
      const ra = st.from.length();
      const rb = to.length();
      v.a.copy(st.from).normalize();
      v.b.copy(to).normalize();
      v.q.setFromUnitVectors(v.a, v.b);
      v.qi.identity().slerp(v.q, e);
      cam.position.copy(v.a).applyQuaternion(v.qi).multiplyScalar(ra + (rb - ra) * e);
      v.look.copy(st.fromLook).lerp(st.mode === "detail" ? target : v.b.set(0, 0, 0), e);
    } else {
      cam.position.copy(to);
      v.look.copy(toLook);
    }
    st.k = st.mode === "detail" ? e : 1 - e;

    v.up.copy(v.Y).lerp(v.radial, st.k * 0.85).normalize();
    cam.up.copy(v.up);
    cam.lookAt(v.look);

    // ── the side panel has its own column now: keep the globe centred in its area
    const wantShift = 0;
    st.shift += (wantShift - st.shift) * (1 - Math.exp(-dt * 4));
    cam.setViewOffset(size.width, size.height, st.shift * size.width, 0, size.width, size.height);
    U.warpCenter.value.set(0.5 - st.shift, 0.5);
    U.aspect.value = size.width / size.height;

    // ── uniforms
    U.focus.value = st.k;
    U.focusDepth.value = cam.position.distanceTo(target);
    const zoom = 1 - Math.min(1, Math.max(0, (cam.position.length() - 2.2) / 1.6));
    U.grid.value = zoom * zoom * (3 - 2 * zoom);
  }, -5);

  return null;
}
