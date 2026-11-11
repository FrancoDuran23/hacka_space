import type { Metadata } from "next";
import { publicChain } from "@/lib/config";
import { getEscrows } from "@/lib/escrow";
import { OperatorDashboard } from "@/components/operator/OperatorDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "OrbitClear · Panel del operador" };

export default async function Page() {
  const [snapshot, chain] = await Promise.all([getEscrows(), publicChain()]);
  return <OperatorDashboard initial={snapshot} chain={chain} />;
}
