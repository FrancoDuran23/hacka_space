// satellite.js' package entry also re-exports an optional WASM/pthreads build that drags
// `node:worker_threads` into the bundle and breaks `next build`. Only the pure-JS SGP4
// propagator is needed here, so its modules are imported directly.
export { twoline2satrec } from "../node_modules/satellite.js/dist/io.js";
export { propagate, gstime } from "../node_modules/satellite.js/dist/propagation.js";
export { jday } from "../node_modules/satellite.js/dist/ext.js";
export { sunPos } from "../node_modules/satellite.js/dist/sun.js";
export type { SatRec } from "../node_modules/satellite.js/dist/propagation/SatRec.js";
