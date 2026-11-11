"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { EscrowStatus, ObjectKind } from "@/lib/types";
import { STATUS_COLOR } from "@/lib/status";

/** Real spacecraft models (same assets as the console). Rocket bodies and fragments stay procedural. */
const SATELLITE_MODELS = ["/models/landsat.glb", "/models/acrimsat.glb"] as const;
const FIT = 2.4;

/** One WebGL context for every card: each card is a scissored View of this canvas. */
export function CardCanvas() {
  return (
    <Canvas className="!pointer-events-none !fixed !inset-0 z-20" gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <View.Port />
    </Canvas>
  );
}

export function CardModel({ kind, objectId, status }: { kind: ObjectKind; objectId: number; status: EscrowStatus }) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0.6, 4.4]} fov={38} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-3, -1, 2]} intensity={6} color={STATUS_COLOR[status]} />
      <Spin seed={objectId}>
        {kind === "satellite" ? <Spacecraft url={SATELLITE_MODELS[objectId % SATELLITE_MODELS.length]} /> : <Procedural kind={kind} />}
      </Spin>
    </View>
  );
}

function Spin({ seed, children }: { seed: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const phase = (seed % 97) / 97;
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * 0.35;
    g.current.rotation.x = Math.sin(performance.now() / 2400 + phase * 6) * 0.25;
  });
  return (
    <group ref={g} rotation={[0.3, phase * Math.PI * 2, 0.15]}>
      {children}
    </group>
  );
}

function Spacecraft({ url }: { url: string }) {
  const { scene } = useGLTF(url, false, true);
  const model = useMemo(() => {
    // every source file has its own units: centre it and fit it to the card
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const fit = FIT / Math.max(size.x, size.y, size.z);
    root.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-fit);
    root.scale.setScalar(fit);
    return root;
  }, [scene]);
  return <primitive object={model} />;
}

const hull = new THREE.MeshStandardMaterial({ color: "#c4cddb", metalness: 0.6, roughness: 0.42 });
const dark = new THREE.MeshStandardMaterial({ color: "#2a3140", metalness: 0.7, roughness: 0.5 });
const gold = new THREE.MeshStandardMaterial({ color: "#a8802f", metalness: 0.9, roughness: 0.5 });

function Procedural({ kind }: { kind: Exclude<ObjectKind, "satellite"> }) {
  if (kind === "fragment") {
    return (
      <group scale={0.9}>
        <mesh material={hull} rotation={[0.4, 0.2, 0.7]}>
          <icosahedronGeometry args={[0.7, 0]} />
        </mesh>
        <mesh material={gold} position={[0.55, -0.2, 0.1]} rotation={[0.9, 0.3, 0.2]}>
          <boxGeometry args={[0.7, 0.04, 0.45]} />
        </mesh>
      </group>
    );
  }
  // spent upper stage: tank, interstage ring, engine bell
  return (
    <group rotation={[0, 0, Math.PI / 2]} scale={0.85}>
      <mesh material={hull}>
        <cylinderGeometry args={[0.42, 0.42, 2.1, 24]} />
      </mesh>
      <mesh material={dark} position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.445, 0.445, 0.1, 28]} />
      </mesh>
      <mesh material={hull} position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.42, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={dark} position={[0, -1.3, 0]}>
        <cylinderGeometry args={[0.16, 0.36, 0.5, 20, 1, true]} />
      </mesh>
    </group>
  );
}

for (const url of SATELLITE_MODELS) useGLTF.preload(url, false, true);
