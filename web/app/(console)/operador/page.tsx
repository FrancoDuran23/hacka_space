import type { Metadata } from "next";
import { auth } from "@/lib/auth/server";
import { publicChain } from "@/lib/config";
import { getEscrows } from "@/lib/escrow";
import { DEFAULT_OPERATOR, satcatOwner } from "@/lib/operators";
import { OperatorDashboard } from "@/components/operator/OperatorDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "OrbitClear · Panel del operador" };

export default async function Page() {
  const [snapshot, chain, session] = await Promise.all([getEscrows(), publicChain(), auth.getSession().catch(() => null)]);
  const user = session?.data?.user;
  const account = user ? { name: user.name || user.email } : null;
  // each account is one operator: its name is the operator's name (the demo seed creates them that way)
  const operator = user?.name?.trim() || DEFAULT_OPERATOR;
  return <OperatorDashboard initial={snapshot} chain={chain} account={account} operator={operator} satcat={satcatOwner(operator)} />;
}
