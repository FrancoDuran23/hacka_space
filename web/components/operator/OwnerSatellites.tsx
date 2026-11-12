"use client";

import { useEffect, useMemo, useState } from "react";
import { operatorSatellites } from "@/lib/satellites/actions";
import type { OwnedSatellite } from "@/lib/operator-catalog";

const OPS_LABEL: Record<string, string> = {
  "+": "operativo",
  P: "parcial",
  B: "respaldo",
  S: "reserva",
  X: "misión extendida",
  "-": "no operativo",
};

/** The operator's satellites from SATCAT that have no escrow yet: one click fills the NORAD. */
export function OwnerSatellites({ owner, label, onPick }: { owner: string; label: string; onPick: (norad: number) => void }) {
  const [list, setList] = useState<OwnedSatellite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let live = true;
    operatorSatellites(owner)
      .then((r) => live && (r.ok ? setList(r.satellites) : setError(r.error)))
      .catch(() => live && setError("No se pudo cargar la lista de satélites."));
    return () => {
      live = false;
    };
  }, [owner]);

  const shown = useMemo(() => {
    const q = filter.trim().toUpperCase();
    return (list ?? []).filter((s) => !q || s.name.toUpperCase().includes(q) || String(s.norad).includes(q));
  }, [list, filter]);

  return (
    <section className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="panel-title">Satélites de {label} sin registrar</h3>
        {list && <span className="text-[11.5px] text-faint">{list.length} en el catálogo</span>}
      </div>
      {error ? (
        <p className="mt-2 text-[12.5px] text-bad">{error}</p>
      ) : !list ? (
        <p className="blink-soft mt-2 text-[12.5px] text-dim">Cargando el catálogo de CelesTrak…</p>
      ) : list.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-dim">No quedan satélites de {label} por registrar.</p>
      ) : (
        <>
          <input
            placeholder="Buscar por nombre o NORAD"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-2 h-8 w-full rounded-[8px] bg-white/[0.05] px-3 text-[12.5px] text-ink outline-none placeholder:text-faint focus:shadow-[inset_0_0_0_1px_rgb(56_232_255/0.5)]"
          />
          <ul className="scroll-thin mt-2 max-h-[240px] space-y-1 overflow-y-auto pr-1">
            {shown.map((s) => (
              <li key={s.norad}>
                <button
                  type="button"
                  onClick={() => onPick(s.norad)}
                  className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-baseline gap-x-3 rounded-[8px] px-3 py-2 text-left text-[12.5px] hover:bg-cyan/10"
                >
                  <span className="truncate text-ink">{s.name}</span>
                  <span className={`text-[11px] ${s.ops === "+" || s.ops === "X" ? "text-ok" : "text-faint"}`}>{OPS_LABEL[s.ops] ?? "estado desconocido"}</span>
                  <span className="mono truncate text-[11px] text-dim">
                    NORAD {s.norad} · {s.launchDate} · {s.apogeeKm.toLocaleString("es-AR")} km
                  </span>
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-2 text-[12.5px] text-faint">Ninguno coincide con la búsqueda.</li>}
          </ul>
        </>
      )}
    </section>
  );
}
