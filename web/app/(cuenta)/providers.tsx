"use client";

import { getSafeRedirectTo } from "@better-auth-ui/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/cuenta-ui/sonner";
import { TooltipProvider } from "@/components/cuenta-ui/tooltip";
import { authClient } from "@/lib/auth/client";
import { localization } from "@/lib/auth/localization";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        authClient={authClient}
        basePaths={{ settings: "/account" }}
        emailAndPassword={{ requireEmailVerification: false }}
        localization={localization}
        navigate={({ to, replace }) => {
          const path = getSafeRedirectTo(to, window.location.origin);
          const target = path.startsWith("//") ? "/" : path.replace(/^\/auth\/sign-in(?=[?#]|$)/, "/login");
          if (replace) router.replace(target);
          else router.push(target);
        }}
        Link={Link}
        redirectTo="/operador"
      >
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
