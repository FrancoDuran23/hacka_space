import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/regulador/OnboardingForm";
import { RegulatorView } from "@/components/regulador/RegulatorView";
import { auth } from "@/lib/auth/server";
import { regulatorDashboard } from "@/lib/regulador/actions";

export const dynamic = "force-dynamic";

export default async function ReguladorPage() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/login");

  const dash = await regulatorDashboard();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      {dash ? <RegulatorView dash={dash} /> : <OnboardingForm />}
    </main>
  );
}
