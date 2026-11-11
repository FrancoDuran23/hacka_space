import { getEscrows } from "@/lib/escrow";
import { Console } from "@/components/Console";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await getEscrows();
  return <Console initial={snapshot} />;
}
