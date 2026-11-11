"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three/webgpu";
import {
  abs,
  cameraPosition,
  color,
  float,
  fract,
  fwidth,
  max,
  min,
  mix,
  normalWorld,
  normalize,
  positionWorld,
  reflect,
  sin,
  smoothstep,
  texture,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { gmstAt, latLonToLocal } from "@/lib/orbit";
import { sim } from "@/lib/store";
import { U } from "./shared";

const SALTA = { lat: -24.79, lon: -65.41 };

export function Earth() {
  const spin = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const beacon = useRef<THREE.Sprite>(null);
  const { camera } = useThree();

  const [dayMap, nightMap, dataMap] = useLoader(THREE.TextureLoader, [
    "/textures/earth_day_4096.jpg",
    "/textures/earth_night_4096.jpg",
    "/textures/earth_bump_roughness_clouds_4096.jpg", // R bump · G roughness · B clouds
  ]);

  const mats = useMemo(() => {
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    for (const t of [dayMap, nightMap, dataMap]) t.anisotropy = 8;

    const sun = normalize(U.sunDir);
    const N = normalize(normalWorld);
    const V = normalize(cameraPosition.sub(positionWorld));
    const lit = N.dot(sun);
    const daylight = smoothstep(-0.12, 0.28, lit);
    const rim = float(1).sub(max(N.dot(V), 0));
    const dim = float(1).sub(U.focus.mul(0.62)).mul(U.intro);

    // ── surface: night-first look. City lights carry the image; the day side stays deep and cold.
    const surface = new THREE.MeshBasicNodeMaterial();
    const albedo = texture(dayMap, uv()).rgb;
    const grey = albedo.dot(vec3(0.3, 0.59, 0.11));
    const cold = mix(vec3(grey), albedo, 0.6).mul(vec3(0.5, 0.72, 1.0));
    const dayCol = cold.mul(max(lit, 0).mul(0.8).add(0.12));
    const cities = texture(nightMap, uv()).rgb;
    const nightCol = cities.pow(vec3(1.35)).mul(vec3(1.3, 1.02, 0.7)).mul(3.0).add(cold.mul(0.02));
    const cover = smoothstep(0.2, 0.9, texture(dataMap, uv()).b);
    const water = float(1).sub(texture(dataMap, uv()).g);
    const glint = max(reflect(sun.negate(), N).dot(V), 0).pow(90).mul(water).mul(daylight).mul(float(1).sub(cover)).mul(0.5);
    const twilight = smoothstep(-0.25, 0.0, lit).mul(smoothstep(0.3, 0.0, lit));
    let surf = mix(nightCol, dayCol, daylight);
    surf = surf.add(color("#ffd7a8").mul(glint));
    surf = surf.add(color("#ff7a3d").mul(twilight).mul(rim.pow(2)).mul(0.22));
    surf = surf.add(color("#19c9ff").mul(rim.pow(3.2)).mul(daylight.mul(0.75).add(0.18)));
    surface.colorNode = vec4(surf.mul(dim), 1);

    // ── clouds: own shell, drifts a little faster than the ground
    const cloud = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    cloud.colorNode = vec4(mix(vec3(0.12, 0.17, 0.3), vec3(0.6, 0.72, 0.88), daylight).mul(dim), 1);
    cloud.opacityNode = cover.mul(daylight.mul(0.62).add(0.16));

    // ── atmosphere: fresnel glow on a slightly larger back-faced shell
    const atmo = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const edge = float(1).sub(abs(N.dot(V)));
    const halo = smoothstep(0.0, 0.62, edge.oneMinus()).pow(2.4);
    const sunSide = smoothstep(-0.7, 0.6, lit);
    atmo.colorNode = vec4(mix(color("#6b3dff"), color("#22d4ff"), sunSide).mul(2.0), 1);
    atmo.opacityNode = halo.mul(sunSide.mul(0.75).add(0.3)).mul(dim);

    // ── holographic graticule (15° lines), fades in with zoom
    const grid = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const cell = uv().mul(vec2(24, 12));
    const px = fwidth(cell);
    const dist = abs(fract(cell.sub(0.5)).sub(0.5)).div(px);
    const line = float(1).sub(min(min(dist.x, dist.y), 1));
    const equator = float(1).sub(min(abs(uv().y.sub(0.5)).div(fwidth(uv().y)).mul(0.5), 1));
    const sweep = sin(uv().y.mul(90).sub(time.mul(1.2))).mul(0.5).add(0.5).mul(0.35).add(0.65);
    grid.colorNode = vec4(color("#38e8ff").mul(1.5), 1);
    grid.opacityNode = max(line.mul(0.26), equator.mul(0.5)).mul(sweep).mul(U.grid).mul(float(1).sub(rim.pow(1.5))).mul(dim);

    // ── Salta beacon
    const pulse = uniform(0);
    const beaconMat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    beaconMat.sizeAttenuation = false;
    const d = uv().sub(0.5).length().mul(2);
    const dot = smoothstep(0.2, 0.0, d);
    const wave = smoothstep(0.07, 0.0, abs(d.sub(pulse.mul(0.85).add(0.1)))).mul(float(1).sub(pulse));
    beaconMat.colorNode = vec4(color("#38e8ff").mul(3.5), 1);
    beaconMat.opacityNode = dot.add(wave.mul(0.9)).mul(U.intro).mul(float(1).sub(U.focus.mul(0.7)));

    return { surface, cloud, atmo, grid, beaconMat, pulse };
  }, [dayMap, nightMap, dataMap]);

  useEffect(
    () => () => {
      mats.surface.dispose();
      mats.cloud.dispose();
      mats.atmo.dispose();
      mats.grid.dispose();
      mats.beaconMat.dispose();
    },
    [mats],
  );

  const globe = useMemo(() => new THREE.SphereGeometry(1, 128, 64), []);
  const salta = useMemo(() => new THREE.Vector3(...latLonToLocal(SALTA.lat, SALTA.lon, 1.006)), []);
  const tmp = useMemo(() => ({ w: new THREE.Vector3(), c: new THREE.Vector3(), d: new Date() }), []);

  useFrame((_, dt) => {
    const g = spin.current;
    if (!g) return;
    tmp.d.setTime(sim.time);
    g.rotation.y = gmstAt(tmp.d);
    if (clouds.current) clouds.current.rotation.y += dt * (0.003 + U.warp.value * 0.05);
    mats.pulse.value = (performance.now() / 1800) % 1;
    // hide the label when Salta is behind the limb
    tmp.w.copy(salta).applyMatrix4(g.matrixWorld);
    tmp.c.copy(camera.position).sub(tmp.w).normalize();
    const facing = tmp.w.normalize().dot(tmp.c);
    if (label.current) label.current.style.opacity = String(Math.min(1, Math.max(0, (facing - 0.08) * 5)) * U.intro.value * (1 - U.focus.value));
  });

  return (
    <group>
      <group ref={spin}>
        <mesh geometry={globe} material={mats.surface} />
        <mesh ref={clouds} geometry={globe} material={mats.cloud} scale={1.007} />
        <mesh geometry={globe} material={mats.grid} scale={1.012} />
        <group position={salta}>
          <sprite ref={beacon} material={mats.beaconMat} scale={0.05} />
          <Html zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div ref={label} className="salta-label" style={{ opacity: 0 }}>
              <span className="salta-dot" />
              Argentina Space · Salta
            </div>
          </Html>
        </group>
      </group>
      <mesh geometry={globe} material={mats.atmo} scale={1.075} />
    </group>
  );
}
