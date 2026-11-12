import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/celestrak";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const group = new URL(req.url).searchParams.get("group") ?? "visual";
  const snap = await getCatalog(group);
  return NextResponse.json(snap);
}
