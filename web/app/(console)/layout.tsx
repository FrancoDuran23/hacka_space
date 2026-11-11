import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import "../globals.css";

export const metadata: Metadata = {
  title: "OrbitClear · Deorbit Deposit Escrow",
  description: "Garantía de desorbitado verificada con datos públicos, sobre Avalanche. Argentina Space 2026.",
};

export const viewport: Viewport = { themeColor: "#02040a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable}`}>
      <body>{children}</body>
    </html>
  );
}
