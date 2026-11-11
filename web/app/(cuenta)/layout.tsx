import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Link from "next/link";

import { UserButton } from "@/components/auth/user/user-button";
import { Button } from "@/components/cuenta-ui/button";
import "./cuenta.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "OrbitClear · Cuenta",
  description: "Garantía de desorbitado de satélites en Avalanche",
};

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Orbit<span className="text-[#E84142]">Clear</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/cuenta">Mi cuenta</Link>
              </Button>
              <UserButton size="icon" />
            </nav>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
