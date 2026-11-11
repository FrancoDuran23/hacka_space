const usd = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

/** "$ 125.000 USD" */
export function formatUSD(n: number, opts: { sign?: boolean; suffix?: boolean } = {}): string {
  const { sign = false, suffix = true } = opts;
  const abs = usd.format(Math.abs(Math.round(n)));
  const s = n < 0 ? "−" : sign ? "+" : "";
  return `${s}$ ${abs}${suffix ? " USD" : ""}`;
}

export function compactUSD(n: number): string {
  const a = Math.abs(n);
  const s = n < 0 ? "−" : "";
  if (a >= 1e6) return `${s}$ ${(a / 1e6).toFixed(2).replace(".", ",")}M`;
  if (a >= 1e3) return `${s}$ ${Math.round(a / 1e3)}K`;
  return `${s}$ ${Math.round(a)}`;
}

export function shortHash(h: string | null | undefined, head = 6, tail = 4): string {
  if (!h) return "—";
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

export function countdown(ms: number): string {
  const neg = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${neg ? "−" : "T−"}${d > 0 ? `${d}D ` : ""}${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function utcClock(t: number): string {
  return new Date(t).toISOString().slice(11, 19);
}

export function utcDate(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .slice(0, 3)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
