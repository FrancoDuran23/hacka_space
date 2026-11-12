"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, View, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { modelForObject } from "@/lib/models";
import { STATUS_COLOR } from "@/lib/status";
import type { DebrisObject, EscrowStatus } from "@/lib/types";

const FIT = 2.4;

/** One WebGL context for every card: each card is a scissored View of this canvas. */
export function CardCanvas() {
  return (
    <Canvas className="!pointer-events-none !fixed !inset-0 z-20" gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
      <View.Port />
    </Canvas>
  );
}

/** Same model the console shows for the object (lib/models). */
export function CardModel({ object, status }: { object: Pick<DebrisObject, "name" | "kind" | "objectId">; status: EscrowStatus }) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0.6, 4.4]} fov={38} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight position={[-3, -1, 2]} intensity={6} color={STATUS_COLOR[status]} />
      <Spin seed={object.objectId}>
        <Spacecraft url={modelForObject(object)} />
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
