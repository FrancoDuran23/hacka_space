"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { color, fract, max, mix, smoothstep, uniform, uv, vec2, vec4 } from "three/tsl";
import { eciScene, periodMinutes, satrecFor } from "@/lib/orbit";
import { statusAt } from "@/lib/status";
import { app, sim, useApp } from "@/lib/store";
import type { ObjectKind } from "@/lib/types";
import { STATE_RGB, U, clamp01, positions } from "./shared";

const MODEL_SCALE = 0.011;
const ORBIT_POINTS = 360;

function useMaterials() {
  const m = useMemo(() => {
    const tint = uniform(new THREE.Color("#a6e9ff"));
    const heat = uniform(0);
    const fire = mix(color("#ff3d0a"), color("#ffb45e"), heat);

    const hull = new THREE.MeshStandardNodeMaterial({ color: "#c4cddb", metalness: 0.6, roughness: 0.42 });
    hull.emissiveNode = tint.mul(0.012).add(fire.mul(heat).mul(2.2));
    const dark = new THREE.MeshStandardNodeMaterial({ color: "#2a3140", metalness: 0.7, roughness: 0.5 });
    dark.emissiveNode = fire.mul(heat).mul(3);
    const solar = new THREE.MeshStandardNodeMaterial({ color: "#0a1538", metalness: 0.35, roughness: 0.3, side: THREE.DoubleSide });
    // photovoltaic cells: faint glowing seams
    const cell = fract(uv().mul(vec2(9, 4)));
    const seam = smoothstep(0.9, 0.97, max(cell.x, cell.y));
    solar.emissiveNode = color("#2f7dff").mul(seam.mul(0.5).add(0.02)).add(fire.mul(heat).mul(2.5));
    const gold = new THREE.MeshStandardNodeMaterial({ color: "#a8802f", metalness: 0.9, roughness: 0.5 });
    gold.emissiveNode = color("#c79a3c").mul(0.02).add(fire.mul(heat).mul(3.5));

    const wire = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    wire.colorNode = vec4(tint.mul(1.6), 1);
    wire.opacityNode = U.focus.mul(0.42);

    const ring = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const ringAlpha = uniform(1);
    ring.colorNode = vec4(tint.mul(1.9), 1);
    ring.opacityNode = U.focus.mul(ringAlpha).mul(U.intro);
    return { tint, heat, hull, dark, solar, gold, wire, ring, ringAlpha };
  }, []);
  useEffect(
    () => () => {
      for (const k of ["hull", "dark", "solar", "gold", "wire", "ring"] as const) m[k].dispose();
    },
    [m],
  );
  return m;
}

type Mats = ReturnType<typeof useMaterials>;

/** Real spacecraft models (assets/models-3d, compressed into public/models) used for defunct satellites. */
const SATELLITE_MODELS = ["/models/landsat.glb", "/models/acrimsat.glb"];
const modelCache = new Map<string, Promise<THREE.Group>>();

function loadSpacecraft(url: string): Promise<THREE.Group> {
  let pending = modelCache.get(url);
  if (!pending) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    pending = loader.loadAsync(url).then((gltf) => {
      // every source file has its own units: centre it and fit it to the size of the procedural models
      const root = gltf.scene as unknown as THREE.Group;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      const fit = 3.2 / Math.max(size.x, size.y, size.z);
      root.position.copy(centre).multiplyScalar(-fit);
      root.scale.setScalar(fit);
      // baked textures are very bright next to the dark scene: tone the albedo down
      root.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!mat?.color) return;
        mat.color.multiplyScalar(0.42);
        // no mirror-like hot spots from the camera light: they blow out through the bloom
        mat.roughness = Math.max(mat.roughness ?? 1, 0.7);
        mat.metalness = Math.min(mat.metalness ?? 0, 0.25);
      });
      const holder = new THREE.Group();
      holder.add(root);
      return holder;
    });
    modelCache.set(url, pending);
  }
  return pending;
}

/** Simple procedural spacecraft with a holographic wireframe overlay. */
function buildModel(kind: ObjectKind, m: Mats): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, place?: (o: THREE.Mesh) => void, edges = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    place?.(mesh);
    g.add(mesh);
    if (edges) {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), m.wire);
      lines.position.copy(mesh.position);
      lines.rotation.copy(mesh.rotation);
      lines.scale.copy(mesh.scale).multiplyScalar(1.012);
      g.add(lines);
    }
  };
  if (kind === "rocket-body") {
    // spent upper stage: tank, interstage rings, engine bell
    add(new THREE.CylinderGeometry(0.42, 0.42, 2.3, 14, 1), m.hull, (o) => void (o.rotation.z = Math.PI / 2));
    add(new THREE.CylinderGeometry(0.445, 0.445, 0.1, 28, 1), m.dark, (o) => (o.rotation.z = Math.PI / 2, void o.position.set(0.72, 0, 0)), false);
    add(new THREE.CylinderGeometry(0.445, 0.445, 0.1, 28, 1), m.dark, (o) => (o.rotation.z = Math.PI / 2, void o.position.set(-0.55, 0, 0)), false);
    add(new THREE.SphereGeometry(0.42, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2), m.hull, (o) => (o.rotation.z = -Math.PI / 2, void o.position.set(1.15, 0, 0)));
    add(new THREE.CylinderGeometry(0.16, 0.36, 0.5, 14, 1, true), m.dark, (o) => (o.rotation.z = Math.PI / 2, void o.position.set(-1.4, 0, 0)));
    add(new THREE.CylinderGeometry(0.1, 0.16, 0.16, 16, 1), m.gold, (o) => (o.rotation.z = Math.PI / 2, void o.position.set(-1.2, 0, 0)), false);
  } else if (kind === "satellite") {
    add(new THREE.BoxGeometry(0.8, 0.9, 0.8), m.gold);
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(1.7, 0.03, 0.72), m.solar, (o) => void o.position.set(side * 1.36, 0, 0));
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), m.dark, (o) => (o.rotation.z = Math.PI / 2, void o.position.set(side * 0.46, 0, 0)), false);
    }
    add(new THREE.ConeGeometry(0.34, 0.24, 12, 1, true), m.hull, (o) => (o.rotation.x = Math.PI, void o.position.set(0, 0.6, 0)));
    add(new THREE.CylinderGeometry(0.014, 0.014, 0.7, 6), m.dark, (o) => void o.position.set(0.22, -0.78, 0.2), false);
  } else {
    // collision fragment: torn panel and a twisted chunk of structure
    add(new THREE.IcosahedronGeometry(0.5, 0), m.dark, (o) => void o.scale.set(1.2, 0.55, 0.8));
    add(new THREE.BoxGeometry(1.1, 0.03, 0.6), m.solar, (o) => (o.rotation.set(0.5, 0.3, 0.4), void o.position.set(0.5, 0.2, 0.1)));
    add(new THREE.TetrahedronGeometry(0.3, 0), m.hull, (o) => void o.position.set(-0.55, -0.15, 0.25));
  }
  return g;
}

/** Detail view: the selected point becomes a 3D model and its full orbit is drawn in its state colour. */
export function DetailModel() {
  const id = useApp((s) => s.selectedId);
  const kind = useApp((s) => s.objects.find((o) => o.objectId === s.selectedId)?.kind ?? null);
  const m = useMaterials();
  const { camera } = useThree();
  const holder = useRef<THREE.Group>(null);
  const fill = useRef<THREE.PointLight>(null);
  const shine = useRef<THREE.PointLight>(null);

  const procedural = useMemo(() => (kind ? buildModel(kind, m) : null), [kind, m]);
  useEffect(
    () => () => {
      procedural?.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    },
    [procedural],
  );

  // defunct satellites use a real model once it has loaded; the procedural one covers the wait (or a failed load)
  const url = kind === "satellite" && id != null ? SATELLITE_MODELS[id % SATELLITE_MODELS.length] : null;
  const [loaded, setLoaded] = useState<{ url: string; scene: THREE.Group } | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    loadSpacecraft(url).then(
      (scene) => alive && setLoaded({ url, scene }),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [url]);
  const real = url && loaded?.url === url ? loaded.scene : null;
  const model = real ?? procedural;
  const realMats = useMemo(() => {
    const list: THREE.MeshStandardMaterial[] = [];
    real?.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mat && "emissive" in mat) list.push(mat);
    });
    return list;
  }, [real]);

  const orbit = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((ORBIT_POINTS + 1) * 3), 3));
    const line = new THREE.Line(geo, m.ring);
    line.frustumCulled = false;
    line.visible = false;
    return line;
  }, [m]);
  useEffect(() => () => orbit.geometry.dispose(), [orbit]);

  const state = useRef({ drawnFor: null as number | null, drawnAt: 0 });
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), d: new Date() }), []);

  useFrame((_, dt) => {
    const g = holder.current;
    if (!g) return;
    const s = app.get();
    const o = id == null ? null : s.objects.find((x) => x.objectId === id);
    const p = id == null ? null : positions.get(id);
    if (!o || !p) {
      g.visible = false;
      orbit.visible = U.focus.value > 0.01 && state.current.drawnFor != null;
      if (!orbit.visible) state.current.drawnFor = null;
      return;
    }
    const st = statusAt(o, sim.time);
    const run = s.runs[o.objectId];
    m.tint.value.copy(STATE_RGB[st]);
    g.position.copy(p);
    g.visible = st !== "REFUNDED" && run?.phase !== "burned";
    g.rotation.x += dt * 0.17;
    g.rotation.y += dt * 0.29;
    // glows hotter as it sinks into the atmosphere
    const falling = run?.phase === "falling";
    m.heat.value = falling ? clamp01(1 - (p.length() - 1.004) / 0.09) : 0;
    if (falling) g.rotation.z += dt * 2.5 * m.heat.value;
    for (const mat of realMats) {
      mat.emissive.setRGB(1, 0.42, 0.12);
      mat.emissiveIntensity = m.heat.value * 2.2;
    }
    m.ringAlpha.value = st === "REFUNDED" || falling ? 0.25 : 0.9;

    // full orbit (one revolution), refreshed occasionally: the plane barely moves
    const now = performance.now();
    if (state.current.drawnFor !== o.objectId || now - state.current.drawnAt > 2000) {
      const rec = satrecFor(o.tle);
      const period = periodMinutes(rec) * 60_000;
      const attr = orbit.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i <= ORBIT_POINTS; i++) {
        tmp.d.setTime(sim.time + (i / ORBIT_POINTS) * period);
        if (eciScene(rec, tmp.d, tmp.v)) attr.setXYZ(i, tmp.v.x, tmp.v.y, tmp.v.z);
      }
      attr.needsUpdate = true;
      state.current.drawnFor = o.objectId;
      state.current.drawnAt = now;
    }
    orbit.visible = true;

    if (fill.current) {
      fill.current.position.copy(camera.position);
      fill.current.intensity = (real ? 0.022 : 0.07) * U.focus.value;
    }
    if (shine.current) {
      // earthshine: cool light coming up from the planet
      shine.current.position.copy(p).multiplyScalar(1 - 0.12 / p.length());
      shine.current.intensity = (real ? 0.02 : 0.05) * U.focus.value;
    }
  });

  return (
    <>
      <primitive object={orbit} />
      <group ref={holder} scale={MODEL_SCALE} visible={false}>
        {model && <primitive object={model} />}
      </group>
      <pointLight ref={fill} color="#dcefff" intensity={0} distance={1} decay={2} />
      <pointLight ref={shine} color="#2fd0ff" intensity={0} distance={1} decay={2} />
    </>
  );
}
