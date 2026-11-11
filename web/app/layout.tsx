import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { UserButton } from "@/components/auth/user/user-button";
import { Button } from "@/components/ui/button";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrbitClear",
  description: "Garantía de desorbitado de satélites en Avalanche",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
