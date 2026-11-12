"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserButton } from "@/components/auth/user/user-button";
import { Button } from "@/components/cuenta-ui/button";
import { isCurrentUserAdmin } from "@/lib/admin-actions";

/** Account links in the header; hidden while signing in or signing up, where there is no account to go to yet. */
export function AccountNav() {
  const pathname = usePathname();
  const onAuthPage = pathname === "/login" || pathname.startsWith("/auth/");
  // Administración only for ADMIN_EMAILS, as the old /cuenta page did
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (onAuthPage) return;
    isCurrentUserAdmin().then(setIsAdmin, () => setIsAdmin(false));
  }, [onAuthPage]);
  if (onAuthPage) return null;
  return (
    <nav className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/operador">Panel del operador</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/regulador">Regulador</Link>
      </Button>
      {isAdmin && (
        <Button variant="ghost" asChild>
          <Link href="/admin">Administración</Link>
        </Button>
      )}
      <Button variant="ghost" asChild>
        <Link href="/account/account">Mi cuenta</Link>
      </Button>
      <UserButton size="icon" />
    </nav>
  );
}
