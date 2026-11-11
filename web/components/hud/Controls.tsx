"use client";

import { motion } from "framer-motion";
import { utcClock, utcDate } from "@/lib/format";
import { WARP_SPEED, app, sim, useApp, useRealTime, useSimTime } from "@/lib/store";
import { Button } from "@/components/ui/button";

/** Simulation controls, bottom-left of the globe view. */
export function Controls() {
  const warping = useApp((s) => s.warpTarget > 1);
  const simTime = useSimTime();
  const real = useRealTime();
  const ahead = simTime - real;
  const drifted = ahead > 90_000;
  return (
    <motion.div
      className="pointer-events-auto fixed bottom-4 left-4 z-20 flex items-end gap-3"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 1.1, ease: [0.2, 0.8, 0.2, 1] } }}
      exit={{ opacity: 0, y: 30, transition: { duration: 0.25 } }}
    >
      <div className="panel px-4 py-3">
        <div className="label flex items-center gap-2">
          Simulation clock
          {warping && <span className="blink-soft text-[#c9b8ff]">warp ×{WARP_SPEED.toLocaleString("es-AR")}</span>}
        </div>
        <div className={`mono mt-[2px] text-[15px] leading-tight ${warping ? "text-[#c9b8ff]" : "text-ink"}`}>
          {simTime ? `${utcDate(simTime)} ${utcClock(simTime)}` : "---------- --:--:--"}
        </div>
        <div className="mt-[2px] text-[11.5px] text-faint">{drifted ? `${(ahead / 3_600_000).toFixed(1)} h ahead of real time` : "Real time, UTC"}</div>
      </div>
      <Button variant="violet" size="lg" onClick={() => app.set({ warpTarget: warping ? 1 : WARP_SPEED })} aria-pressed={warping}>
        {warping ? "Drop out of warp" : "Warp time"}
      </Button>
      {drifted && !warping && (
        <Button variant="ghost" size="lg" onClick={() => sim.resync()}>
          Sync to now
        </Button>
      )}
    </motion.div>
  );
}

export function Hint() {
  return (
    <motion.div
      className="pointer-events-none fixed left-5 top-[54px] z-10 hidden text-[11.5px] text-faint lg:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 2 } }}
      exit={{ opacity: 0 }}
    >
      Drag to rotate · scroll to zoom · click an object
    </motion.div>
  );
}
