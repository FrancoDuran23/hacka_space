"use client";

import { useSyncExternalStore } from "react";
import type { DataSource, DebrisObject } from "./types";

/** Stages of a DEORBIT run for one object. */
export type DeorbitPhase = "verifying" | "falling" | "burned" | "failed";

export interface DeorbitRun {
  phase: DeorbitPhase;
  txHash: string | null;
  explorerUrl: string | null;
  simulated: boolean;
  payout: number;
  cleaner: string;
  error?: string;
}

export type FeedTone = "ok" | "warn" | "bad" | "info" | "sys";

export interface FeedLine {
  key: string;
  tone: FeedTone;
  label: string;
  target?: string;
  amount?: number;
  txHash?: string | null;
  explorerUrl?: string | null;
  at: number;
  /** lines that arrive after boot get typed out */
  live: boolean;
}

export type RendererKind = "WEBGPU" | "WEBGL2";

export interface AppState {
  objects: DebrisObject[];
  source: DataSource;
  contract: string | null;
  explorer: string;
  selectedId: number | null;
  hoveredId: number | null;
  runs: Record<number, DeorbitRun>;
  feed: FeedLine[];
  /** boot sequence finished: scene fades in, panels assemble */
  booted: boolean;
  renderer: RendererKind | null;
  /** time multiplier requested by the UI (1 = real time) */
  warpTarget: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let state: AppState = {
  objects: [],
  source: "demo",
  contract: null,
  explorer: "",
  selectedId: null,
  hoveredId: null,
  runs: {},
  feed: [],
  booted: false,
  renderer: null,
  warpTarget: 1,
};

export const app = {
  get: () => state,
  set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};

export function useApp<T>(pick: (s: AppState) => T): T {
  return useSyncExternalStore(
    app.subscribe,
    () => pick(state),
    () => pick(state),
  );
}

let feedSeq = 0;
export function pushFeed(line: Omit<FeedLine, "key" | "at" | "live"> & { at?: number; live?: boolean }) {
  const full: FeedLine = { key: `f${++feedSeq}`, at: Date.now(), live: true, ...line };
  app.set((s) => ({ feed: [full, ...s.feed].slice(0, 60) }));
}

export function patchObject(id: number, patch: Partial<DebrisObject>) {
  app.set((s) => ({ objects: s.objects.map((o) => (o.objectId === id ? { ...o, ...patch } : o)) }));
}

export function patchRun(id: number, patch: Partial<DeorbitRun>) {
  app.set((s) => (s.runs[id] ? { runs: { ...s.runs, [id]: { ...s.runs[id], ...patch } } } : {}));
}

// ───────────── simulation clock (mutable, read every frame by the scene) ─────────────

/** WARP TIME: 3 simulated hours per real second. */
export const WARP_SPEED = 10_800;

export const sim = {
  time: Date.now(),
  /** smoothed multiplier */
  speed: 1,
  /** 0..1, drives the warp visuals */
  intensity: 0,
  last: 0,
  advance(perfNow: number) {
    const dt = this.last ? Math.min(0.1, (perfNow - this.last) / 1000) : 0;
    this.last = perfNow;
    const target = state.warpTarget;
    this.speed += (target - this.speed) * (1 - Math.exp(-dt * (target > this.speed ? 1.6 : 3.2)));
    if (Math.abs(this.speed - target) < 0.5) this.speed = target;
    this.intensity = Math.min(1, Math.log(Math.max(1, this.speed)) / Math.log(WARP_SPEED));
    this.time += dt * 1000 * this.speed;
  },
  resync() {
    this.time = Date.now();
    this.speed = 1;
    app.set({ warpTarget: 1 });
  },
};

// UI samples the clocks at 5 Hz through one shared ticker.
let simSample = 0;
let realSample = 0;
const tickers = new Set<Listener>();
let handle: ReturnType<typeof setInterval> | null = null;

function subscribeTick(l: Listener) {
  tickers.add(l);
  handle ??= setInterval(() => {
    simSample = sim.time;
    realSample = Date.now();
    tickers.forEach((t) => t());
  }, 200);
  return () => {
    tickers.delete(l);
    if (tickers.size === 0 && handle) {
      clearInterval(handle);
      handle = null;
    }
  };
}

/** Simulated time in ms (0 until mounted). */
export const useSimTime = () => useSyncExternalStore(subscribeTick, () => simSample, () => 0);
/** Wall clock in ms (0 until mounted). */
export const useRealTime = () => useSyncExternalStore(subscribeTick, () => realSample, () => 0);

// Dev-only handle for poking the simulation from the browser console / end-to-end checks.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __orbitclear?: unknown }).__orbitclear = { app, sim };
}
