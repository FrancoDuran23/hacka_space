"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { abs, convertToTexture, mix, pass, screenUV, smoothstep, vec2, vec3, vec4 } from "three/tsl";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { gaussianBlur } from "three/examples/jsm/tsl/display/GaussianBlurNode.js";
import { U } from "./shared";

/**
 * Post chain on three's node pipeline (runs on WebGPU and on the WebGL 2 fallback):
 * focus blur in detail view → bloom → chromatic aberration → vignette.
 */
export function Post() {
  const { gl, scene, camera } = useThree();
  const pipeline = useMemo(() => {
    const p = new THREE.RenderPipeline(gl as unknown as THREE.WebGPURenderer);
    const scenePass = pass(scene, camera);
    const hdr = scenePass.getTextureNode("output");

    // detail view: keep the target sharp, melt everything far from its depth.
    // A quarter-resolution gaussian mixed in by distance to the focal plane: cheap enough for integrated GPUs.
    const soft = gaussianBlur(hdr, null, 5, { resolutionScale: 0.25 }) as unknown as THREE.Node<"vec4">;
    const depth = scenePass.getViewZNode().negate();
    const off = abs(depth.sub(U.focusDepth));
    const coc = smoothstep(U.focusDepth.mul(0.5), U.focusDepth.mul(2.5).add(0.05), off).mul(U.focus).mul(U.sharp.oneMinus());
    const focused = mix(hdr, soft, coc);
    const glow = bloom(focused, 0.95, 0.6, 0.62);
    const lit = convertToTexture(focused.add(glow));

    // chromatic aberration (a touch at rest, stronger in warp)
    const fringe = screenUV.sub(U.warpCenter).mul(U.warp.mul(0.007).add(0.0013));
    const img = vec3(lit.sample(screenUV.add(fringe)).r, lit.sample(screenUV).g, lit.sample(screenUV.sub(fringe)).b);

    const r = screenUV.sub(0.5).mul(vec2(1.0, 0.85)).length();
    const vignette = smoothstep(0.92, 0.3, r).mul(0.72).add(0.28);
    const violetLift = vec3(0.012, 0.004, 0.03).mul(U.warp);
    p.outputNode = vec4(img.mul(vignette).add(violetLift), 1);
    return p;
  }, [gl, scene, camera]);

  useEffect(() => () => pipeline.dispose(), [pipeline]);
  useFrame(() => pipeline.render(), 1);
  return null;
}
