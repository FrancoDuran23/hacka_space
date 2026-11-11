import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">OrbitClear</h1>
      <p className="max-w-md text-lg text-muted-foreground sm:text-xl">
        Garantías de desorbitado para satélites, custodiadas en Avalanche
      </p>
      <Suspense
        fallback={<div className="h-11 w-64 animate-pulse rounded-lg bg-muted" />}
      >
        <SessionActions />
      </Suspense>
    </main>
  );
}

async function SessionActions() {
  const { data: session } = await auth.getSession();

  if (session?.user) {
    return (
      <Button asChild size="lg" className="h-11 px-6 text-base">
        <Link href="/cuenta">Ir a mi cuenta</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild size="lg" className="h-11 px-6 text-base">
        <Link href="/auth/sign-in">Ingresar</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
        <Link href="/auth/sign-up">Crear cuenta</Link>
      </Button>
    </div>
  );
}
