"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserButton } from "@/components/auth/user/user-button";
import { Button } from "@/components/cuenta-ui/button";

/** Account links in the header; hidden while signing in or signing up, where there is no account to go to yet. */
export function AccountNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/auth/")) return null;
  return (
    <nav className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/operador">Panel del operador</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/account/account">Mi cuenta</Link>
      </Button>
      <UserButton size="icon" />
    </nav>
  );
}
