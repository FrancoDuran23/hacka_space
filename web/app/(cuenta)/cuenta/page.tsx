import { FileCode, ShieldCheck, SlidersHorizontal, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cuenta-ui/card";
import { isAdminEmail } from "@/lib/admin";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const sections = [
  {
    href: "/cuenta/wallets",
    title: "Mis wallets",
    description: "Wallets verificadas con firma",
    icon: Wallet,
  },
  {
    href: "/cuenta/contratos",
    title: "Direcciones de contratos",
    description: "Contratos importantes en Avalanche Fuji",
    icon: FileCode,
  },
  {
    href: "/regulador",
    title: "Panel de regulador",
    description: "Escrows supervisados por tu agencia",
    icon: ShieldCheck,
  },
];

export default function CuentaPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        <Suspense
          fallback={<div className="h-5 w-48 animate-pulse rounded bg-muted" />}
        >
          <UserEmail />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group outline-none">
            <Card className="h-full transition-colors group-hover:bg-muted/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
              <CardHeader>
                <Icon className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        <Suspense fallback={null}>
          <AdminSection />
        </Suspense>
      </div>
    </main>
  );
}

/** El panel de administración solo se ofrece a emails en ADMIN_EMAILS. */
async function AdminSection() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) return null;
  return (
    <Link href="/admin" className="group outline-none">
      <Card className="h-full transition-colors group-hover:bg-muted/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader>
          <SlidersHorizontal className="size-5 text-muted-foreground" />
          <CardTitle className="text-base">Administración</CardTitle>
          <CardDescription>Vista global y checks de funcionamiento</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

async function UserEmail() {
  const user = await requireUser();
  return <p className="text-muted-foreground">{user.email}</p>;
}
