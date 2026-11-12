import { redirect } from "next/navigation";

import { AccountInfo } from "@/components/admin/AccountInfo";
import { EscrowsByOwner } from "@/components/admin/EscrowsByOwner";
import { GlobalStats } from "@/components/admin/GlobalStats";
import { HealthChecks } from "@/components/admin/HealthChecks";
import { OperatorsList } from "@/components/admin/OperatorsList";
import { RegulatorsList } from "@/components/admin/RegulatorsList";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { adminOverview, isAdminEmail, runChecks } from "@/lib/admin";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** Los server components renderizan una vez por request; Date.now fuera del cuerpo del render (react-hooks/purity). */
function nowMs(): number {
  return Date.now();
}

export default async function AdminPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");

  if (!isAdminEmail(data.user.email)) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sin acceso</CardTitle>
            <CardDescription>
              El panel de administración es solo para administradores. Si
              tendrías que tener acceso, pedile al equipo que agregue tu email a
              la variable ADMIN_EMAILS.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const [checks, overview] = await Promise.all([runChecks(), adminOverview()]);
  const now = nowMs();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Panel de administración
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.user.email} · snapshot {overview.snapshot.source} ·{" "}
          {overview.snapshot.fetchedAt}
        </p>
      </header>

      <HealthChecks checks={checks} />
      <GlobalStats stats={overview.stats} total={overview.objects.length} />
      <OperatorsList stats={overview.stats} objects={overview.objects} />
      <RegulatorsList regulators={overview.regulators} />
      <EscrowsByOwner
        objects={overview.objects}
        explorer={overview.snapshot.explorer}
        now={now}
      />
      <AccountInfo
        walletCount={overview.walletCount}
        contracts={overview.contracts}
      />
    </main>
  );
}
