"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
  atan,
  attribute,
  cameraProjectionMatrix,
  color,
  cos,
  dot,
  exp,
  float,
  instancedBufferAttribute,
  mix,
  modelViewMatrix,
  mx_fractal_noise_float,
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
import { U } from "./shared";

/** Pole of the galactic band: tilted so the Milky Way crosses the frame diagonally. */
const GALAXY_POLE = new THREE.Vector3(0.5, 0.62, -0.6).normalize();

/** Procedural sky colour for a unit direction: violet/blue fractal clouds + a faint Milky Way band. */
function skyColor(dir: THREE.Node<"vec3">) {
  const wide = mx_fractal_noise_float(dir.mul(1.6), 4, 2.1, 0.5).mul(0.5).add(0.5);
  const mid = mx_fractal_noise_float(dir.mul(3.1).add(vec3(11.3, -4.7, 2.9)), 4, 2.0, 0.52).mul(0.5).add(0.5);
  const fine = mx_fractal_noise_float(dir.mul(8.5).add(vec3(-2.1, 6.4, 9.2)), 4, 2.0, 0.55).mul(0.5).add(0.5);

  const violet = color("#6a22d6").mul(smoothstep(0.5, 0.95, wide).pow(1.6)).mul(0.2);
  const blue = color("#0c48c4").mul(smoothstep(0.48, 0.92, mid).pow(1.5)).mul(0.17);
  const rose = color("#b0268f").mul(smoothstep(0.62, 1.0, wide.mul(mid).mul(2.0)).pow(2.0)).mul(0.07);

  const lat = dot(dir, vec3(GALAXY_POLE.x, GALAXY_POLE.y, GALAXY_POLE.z));
  const band = exp(lat.mul(lat).mul(-22));
  const core = exp(lat.mul(lat).mul(-160));
  const dust = smoothstep(0.42, 0.75, fine);
  const galaxy = color("#a9bcff")
    .mul(band.mul(0.06).add(core.mul(0.07)))
    .mul(float(1).sub(dust.mul(0.7)))
    .mul(mid.mul(0.6).add(0.6));
  return violet.add(blue).add(rose).add(galaxy);
}

/**
 * Nebula + Milky Way backdrop. The noise is evaluated once into a texture at start-up
 * (same parameterisation as SphereGeometry UVs), so each frame costs one texture fetch per pixel.
 */
export function Nebula() {
  const { gl } = useThree();
  const sky = useMemo(() => {
    const target = new THREE.RenderTarget(2048, 1024, { type: THREE.HalfFloatType, depthBuffer: false });
    target.texture.wrapS = THREE.RepeatWrapping;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false });
    mat.colorNode = vec4(texture(target.texture, uv()).rgb.mul(U.intro).mul(float(1).sub(U.focus.mul(0.5))), 1);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1200, 48, 24), mat);
    mesh.renderOrder = -20;
    mesh.frustumCulled = false;
    return { target, mesh, mat };
  }, []);

  useEffect(() => {
    const phi = uv().x.mul(Math.PI * 2);
    const theta = float(1).sub(uv().y).mul(Math.PI);
    const dir = vec3(cos(phi).negate().mul(sin(theta)), cos(theta), sin(phi).mul(sin(theta)));
    const bakeMat = new THREE.MeshBasicNodeMaterial();
    bakeMat.colorNode = vec4(skyColor(dir), 1);
    const quad = new THREE.QuadMesh(bakeMat);
    const renderer = gl as unknown as THREE.WebGPURenderer;
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(sky.target);
    quad.render(renderer);
    renderer.setRenderTarget(prev);
    bakeMat.dispose();
  }, [gl, sky]);

  useEffect(
    () => () => {
      sky.mat.dispose();
      sky.target.dispose();
    },
    [sky],
  );
  return <primitive object={sky.mesh} />;
}

const STAR_TINTS = ["#ffffff", "#ffffff", "#cfe0ff", "#9cc0ff", "#fff0d2", "#ffd0a0", "#c4b0ff"].map((c) => new THREE.Color(c));

function gaussian() {
  return Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(2 * Math.PI * Math.random());
}

/** Thousands of stars at different depths (real parallax), sizes and brightness; a quarter of them twinkle. */
export function Starfield({ count = 10000 }: { count?: number }) {
  const stars = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const tint = new Float32Array(count * 3);
    const shape = new Float32Array(count * 3); // size, twinkle speed, twinkle phase
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.set(gaussian(), gaussian(), gaussian()).normalize();
      if (i % 5 < 2) {
        // 40 % gather along the galactic band
        const off = v.dot(GALAXY_POLE);
        v.addScaledVector(GALAXY_POLE, -off + gaussian() * 0.1).normalize();
      }
      const depth = 30 + Math.pow(Math.random(), 0.7) * 420;
      pos.set([v.x * depth, v.y * depth, v.z * depth], i * 3);
      const c = STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0];
      const mag = Math.pow(Math.random(), 4.5); // few bright, many faint
      const lum = 0.45 + mag * 3.2;
      tint.set([c.r * lum, c.g * lum, c.b * lum], i * 3);
      shape.set([0.0011 + mag * 0.0052, Math.random() < 0.26 ? 1.5 + Math.random() * 4 : 0, Math.random() * 6.283], i * 3);
    }
    const aPos = new THREE.InstancedBufferAttribute(pos, 3);
    const aTint = new THREE.InstancedBufferAttribute(tint, 3);
    const aShape = new THREE.InstancedBufferAttribute(shape, 3);

    const mat = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    mat.sizeAttenuation = false;
    const sh = instancedBufferAttribute(aShape, "vec3") as unknown as THREE.Node<"vec3">;
    const where = instancedBufferAttribute(aPos, "vec3") as unknown as THREE.Node<"vec3">;
    mat.positionNode = where;
    // WARP TIME: every star stretches into a streak pointing away from the vanishing point,
    // longer the further it sits from it (done in the vertex stage, so it costs nothing per pixel).
    const clip = cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(where, 1));
    const away = clip.xy.div(clip.w).sub(U.warpCenter.mul(2).sub(1)).mul(vec2(U.aspect, 1));
    mat.rotationNode = atan(away.y, away.x);
    // only a third of the stars streak; the rest shrink away so overdraw stays bounded
    const streaker = sh.z.greaterThan(4.2).select(float(1), float(0));
    const stretch = U.warp.mul(away.length()).mul(26).mul(streaker);
    const keep = mix(float(1).sub(U.warp), float(1), streaker);
    mat.scaleNode = vec2(sh.x.mul(stretch.add(1)), sh.x.mul(U.warp.mul(-0.25).add(1))).mul(keep);
    const twinkle = sin(time.mul(sh.y).add(sh.z)).mul(0.42).add(0.62);
    const flicker = sh.y.greaterThan(0).select(twinkle, float(1));
    const d = uv().sub(0.5).length().mul(2);
    const disc = exp(d.mul(d).mul(-9)).mul(smoothstep(1.0, 0.5, d));
    mat.colorNode = vec4((instancedBufferAttribute(aTint, "vec3") as unknown as THREE.Node<"vec3">).mul(flicker), 1);
    mat.opacityNode = disc.mul(U.intro).mul(float(1).sub(U.focus.mul(0.45))).div(stretch.mul(0.12).add(1));

    const s = new THREE.Sprite(mat);
    s.count = count;
    s.frustumCulled = false;
    s.renderOrder = -19;
    return s;
  }, [count]);
  useEffect(() => () => void stars.material.dispose(), [stars]);
  return <primitive object={stars} />;
}

const TAIL = 18;

/** Every few seconds a meteor streaks across the frame. */
export function ShootingStars() {
  const { camera } = useThree();
  const run = useRef({ nextAt: 3 + Math.random() * 4, t0: 0, dur: 1, from: new THREE.Vector3(), vel: new THREE.Vector3(), active: false });
  const { line, alpha } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TAIL * 3), 3));
    const fade = new Float32Array(TAIL);
    for (let i = 0; i < TAIL; i++) fade[i] = Math.pow(1 - i / (TAIL - 1), 2.2);
    geo.setAttribute("fade", new THREE.BufferAttribute(fade, 1));
    const alpha = uniform(0);
    const mat = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    mat.colorNode = vec4(color("#dff6ff").mul(3.5), 1);
    mat.opacityNode = attribute("fade", "float").mul(alpha).mul(U.intro);
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    line.visible = false;
    line.renderOrder = -18;
    return { line, alpha };
  }, []);
  const tmp = useMemo(() => ({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  useFrame(({ clock }) => {
    const r = run.current;
    const t = clock.elapsedTime;
    if (!r.active) {
      if (t < r.nextAt) return;
      camera.getWorldDirection(tmp.fwd);
      tmp.right.crossVectors(tmp.fwd, camera.up).normalize();
      tmp.up.crossVectors(tmp.right, tmp.fwd).normalize();
      const side = Math.random() < 0.5 ? -1 : 1;
      r.from
        .copy(camera.position)
        .addScaledVector(tmp.fwd, 60)
        .addScaledVector(tmp.right, -side * (6 + Math.random() * 22))
        .addScaledVector(tmp.up, 6 + Math.random() * 13);
      r.vel
        .copy(tmp.right)
        .multiplyScalar(side)
        .addScaledVector(tmp.up, -0.3 - Math.random() * 0.45)
        .normalize()
        .multiplyScalar(46 + Math.random() * 24);
      r.t0 = t;
      r.dur = 0.65 + Math.random() * 0.5;
      r.active = true;
      line.visible = true;
    }
    const k = (t - r.t0) / r.dur;
    if (k >= 1) {
      r.active = false;
      line.visible = false;
      r.nextAt = t + 5 + Math.random() * 8;
      return;
    }
    const envelope = Math.sin(Math.PI * k);
    const tail = 0.14 * envelope; // seconds of travel
    const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < TAIL; i++) {
      tmp.p.copy(r.from).addScaledVector(r.vel, (t - r.t0) - (tail * i) / (TAIL - 1));
      attr.setXYZ(i, tmp.p.x, tmp.p.y, tmp.p.z);
    }
    attr.needsUpdate = true;
    alpha.value = envelope;
  });
  return <primitive object={line} />;
}
