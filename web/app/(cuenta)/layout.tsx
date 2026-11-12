import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
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

/**
 * Browsers only expose crypto.randomUUID in secure contexts (HTTPS or localhost). @neon/auth calls it
 * at module load, so opening the app over plain HTTP from another host (LAN IP, SSH alias) crashed the
 * page. crypto.getRandomValues exists in every context, so build an RFC 4122 v4 UUID from it.
 */
const RANDOM_UUID_POLYFILL = `(function(){var c=globalThis.crypto;if(!c||typeof c.randomUUID==="function"||typeof c.getRandomValues!=="function")return;c.randomUUID=function(){var b=c.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var h=Array.prototype.map.call(b,function(x){return(x+256).toString(16).slice(1)}).join("");return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20)};})();`;

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} h-full antialiased`}>
      <head>
        {/* Must run before the auth chunks evaluate: see RANDOM_UUID_POLYFILL. */}
        <script dangerouslySetInnerHTML={{ __html: RANDOM_UUID_POLYFILL }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <Link href="/" className="flex items-baseline gap-3">
              <span className="font-pixel text-[24px] leading-none tracking-[0.12em] text-white">ORBITCLEAR</span>
              <span className="hidden text-[12.5px] text-muted-foreground sm:inline">Deorbit deposit escrow</span>
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
