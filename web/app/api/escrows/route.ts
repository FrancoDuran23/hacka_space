import { NextResponse } from "next/server";
import { getEscrows } from "@/lib/escrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await getEscrows();
  return NextResponse.json(snap, { headers: { "cache-control": "no-store" } });
}
