import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  ContractAddressForm,
  ContractAddressList,
} from "@/components/ContractAddressForm";
import { requireUser } from "@/lib/auth/session";
import { listContractAddresses } from "@/lib/contracts/actions";

export const dynamic = "force-dynamic";

export default function ContratosPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Contratos</h1>
        <p className="text-sm text-muted-foreground">
          Direcciones importantes de los contratos del equipo en Avalanche Fuji.
        </p>
      </header>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Cargando…</p>
        }
      >
        <ContractsSection />
      </Suspense>
    </main>
  );
}

async function ContractsSection() {
  const user = await requireUser().catch(() => redirect("/auth/sign-in"));
  const items = await listContractAddresses();
  return (
    <>
      <ContractAddressForm />
      <ContractAddressList items={items} currentUserId={user.id} />
    </>
  );
}
