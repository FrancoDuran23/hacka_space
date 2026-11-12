"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, extend, useFrame, useThree, type ThreeToJSXElements } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { gmstAt, latLonToLocal } from "@/lib/orbit";
import { app, sim, useApp } from "@/lib/store";
import { DebrisField } from "./Debris";
import { DeorbitFX } from "./DeorbitFX";
import { DetailModel } from "./DetailModel";
import { Earth } from "./Earth";
import { Post } from "./Post";
import { Rig } from "./Rig";
import { Nebula, ShootingStars, Starfield } from "./Sky";
import { U } from "./shared";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

const SALTA_LON = -65.41;

/** Simulation clock + sun + boot fade-in. Runs before everything else each frame. */
function Clock() {
  const light = useRef<THREE.DirectionalLight>(null);
  const booted = useApp((s) => s.booted);
  const date = useMemo(() => new Date(), []);
  const sun = useRef<THREE.Vector3 | null>(null);
  useFrame((_, dt) => {
    sim.advance(performance.now());
    U.warp.value = sim.intensity;
    if (!sun.current) {
      // Cinematic sun: placed once so night has just fallen over Salta (city lights on, lit limb to
      // the west). It then stays fixed in inertial space, so WARP TIME sweeps real day/night cycles.
      date.setTime(sim.time);
      const g = gmstAt(date);
      const [lx, ly, lz] = latLonToLocal(-14, SALTA_LON - 112, 1);
      sun.current = new THREE.Vector3(lx * Math.cos(g) + lz * Math.sin(g), ly, -lx * Math.sin(g) + lz * Math.cos(g)).normalize();
    }
    U.sunDir.value.copy(sun.current);
    light.current?.position.copy(sun.current).multiplyScalar(50);
    const target = booted ? 1 : 0;
    U.intro.value += (target - U.intro.value) * (1 - Math.exp(-dt * 1.1));
    if (Math.abs(target - U.intro.value) < 0.002) U.intro.value = target;
  }, -10);
  return (
    <>
      <directionalLight ref={light} intensity={3.2} color="#fff4e6" />
      <ambientLight intensity={0.04} color="#8fb8ff" />
    </>
  );
}

function FpsProbe() {
  const acc = useRef({ n: 0, t: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.n++;
    a.t += dt;
    if (a.t >= 1) {
      (window as unknown as { __fps?: number }).__fps = Math.round(a.n / a.t);
      a.n = 0;
      a.t = 0;
    }
  });
  return null;
}

function Ready() {
  const { gl } = useThree();
  useEffect(() => {
    const backend = (gl as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend;
    app.set({ renderer: backend?.isWebGPUBackend ? "WEBGPU" : "WEBGL2" });
  }, [gl]);
  return null;
}

export default function Scene() {
  const forceWebGL = useMemo(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gl") === "webgl", []);
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      camera={{ fov: 36, near: 0.004, far: 2400, position: [0, 1.4, 5.2] }}
      gl={async (props) => {
        // WebGPURenderer falls back to its WebGL 2 backend by itself when WebGPU is unavailable.
        const renderer = new THREE.WebGPURenderer({
          canvas: props.canvas as HTMLCanvasElement,
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          forceWebGL,
        });
        await renderer.init();
        renderer.setClearColor(0x010207, 1);
        return renderer;
      }}
    >
      <Ready />
      <Clock />
      <Rig />
      <Nebula />
      <Starfield />
      <ShootingStars />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <DebrisField />
      <DetailModel />
      <DeorbitFX />
      <Post />
      <FpsProbe />
    </Canvas>
  );
}
