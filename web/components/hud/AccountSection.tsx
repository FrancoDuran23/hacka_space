"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

type Session = { user: { name?: string | null; email: string } } | null;

/** Sign-in entry point on the landing; the console has no auth providers, so it reads the session endpoint directly. */
export function AccountSection() {
  const [session, setSession] = useState<Session | undefined>(undefined);

  useEffect(() => {
    let live = true;
    fetch("/api/auth/get-session", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: Session) => live && setSession(s?.user ? s : null))
      .catch(() => live && setSession(null));
    return () => {
      live = false;
    };
  }, []);

  return (
    <motion.section
      aria-label="Cuenta"
      className="panel mx-4 mt-4 px-6 py-4"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 } }}
    >
      {session === undefined ? (
        <div className="h-[52px]" />
      ) : session ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="label">Sesión iniciada</div>
            <div className="truncate text-[13px] text-ink">{session.user.name || session.user.email}</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/cuenta" className={buttonVariants({ size: "sm" })}>
              Mi cuenta
            </Link>
            <Link href="/auth/sign-out" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Salir
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="panel-title">Iniciá sesión</div>
            <div className="text-[11.5px] text-dim">Vinculá tu wallet y registrá tus contratos.</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Iniciar sesión
            </Link>
            <Link href="/auth/sign-up" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Crear cuenta
            </Link>
          </div>
        </div>
      )}
    </motion.section>
  );
}
