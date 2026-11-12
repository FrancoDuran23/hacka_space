import * as THREE from "three/webgpu";
import { abs, exp, float, instancedDynamicBufferAttribute, smoothstep, uniform, uv, vec4 } from "three/tsl";

/** Scene-wide uniforms, written once per frame by Clock and Rig. */
export const U = {
  sunDir: uniform(new THREE.Vector3(1, 0, 0)),
  /** 0 → 1 fade-in from black after the boot sequence */
  intro: uniform(0),
  /** 0 → 1 detail view: everything but the target dims and blurs */
  focus: uniform(0),
  /** 0 → 1 warp-time intensity */
  warp: uniform(0),
  /** 0 → 1 lat/lon grid visibility (zoom) */
  grid: uniform(0),
  /** 0 → 1 cancels the detail-view blur (during a deorbit burn) */
  sharp: uniform(0),
  /** distance camera → focused object */
  focusDepth: uniform(3),
  /** viewport width / height */
  aspect: uniform(1.78),
  /** screen-space vanishing point of the warp streaks */
  warpCenter: uniform(new THREE.Vector2(0.5, 0.5)),
};

/** Live inertial position of each object (scene units, 1 = Earth radius). */
export const positions = new Map<number, THREE.Vector3>();
/** Objects currently moved by the deorbit effect instead of SGP4. */
export const fxDriven = new Set<number>();

/** True when the segment camera → point crosses the unit sphere. */
export function behindEarth(cam: THREE.Vector3, p: THREE.Vector3, d: THREE.Vector3): boolean {
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

export const STATE_RGB = {
  ACTIVE: new THREE.Color("#a6e9ff"),
  EXPIRING: new THREE.Color("#58a6ff"),
  FORFEITED: new THREE.Color("#6a5cff"),
  REFUNDED: new THREE.Color("#38e8ff"),
} as const;

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export type SpriteShape = "glow" | "ring" | "star";

export interface SpriteBatch {
  object: THREE.Sprite;
  /** xyz per instance */
  pos: Float32Array;
  /** rgb (HDR) + alpha per instance */
  col: Float32Array;
  size: Float32Array;
  count: number;
  /** flag the buffers for upload */
  commit(): void;
  dispose(): void;
}

/**
 * One draw call of N camera-facing sprites driven from CPU buffers.
 * `attenuate: false` keeps a constant on-screen size (size = fraction of the view at distance 1).
 */
export function createSprites(count: number, opts: { shape: SpriteShape; attenuate: boolean; dimOnFocus?: number }): SpriteBatch {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 4);
  const size = new Float32Array(count);
  const aPos = new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const aCol = new THREE.InstancedBufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage);
  const aSize = new THREE.InstancedBufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage);

  const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  mat.sizeAttenuation = opts.attenuate;
  mat.positionNode = instancedDynamicBufferAttribute(aPos, "vec3");
  mat.scaleNode = instancedDynamicBufferAttribute(aSize, "float");
  const c = instancedDynamicBufferAttribute(aCol, "vec4") as unknown as THREE.Node<"vec4">;
  const d = uv().sub(0.5).length().mul(2); // 0 centre … 1 edge
  let mask;
  if (opts.shape === "ring") {
    mask = smoothstep(0.05, 0.0, abs(d.sub(0.86))).mul(smoothstep(1.0, 0.94, d));
  } else if (opts.shape === "star") {
    mask = exp(d.mul(d).mul(-7)).mul(smoothstep(1.0, 0.6, d));
  } else {
    // hot core + soft halo
    mask = exp(d.mul(d).mul(-42)).add(exp(d.mul(d).mul(-5.5)).mul(0.34)).mul(smoothstep(1.0, 0.7, d));
  }
  const dim = float(1).sub(U.focus.mul(opts.dimOnFocus ?? 0));
  mat.colorNode = vec4(c.rgb, 1);
  mat.opacityNode = c.a.mul(mask).mul(U.intro).mul(dim);

  const object = new THREE.Sprite(mat);
  object.count = count;
  object.frustumCulled = false;
  return {
    object,
    pos,
    col,
    size,
    count,
    commit() {
      aPos.needsUpdate = true;
      aCol.needsUpdate = true;
      aSize.needsUpdate = true;
    },
    dispose() {
      mat.dispose();
    },
  };
}
