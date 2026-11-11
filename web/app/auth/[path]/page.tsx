import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

import { Auth } from "@/components/auth/auth";

const validPaths = new Set(Object.values(viewPaths.auth));

export function generateStaticParams() {
  return [...validPaths].map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  if (!validPaths.has(path)) notFound();

  return (
    <main className="flex flex-1 items-center justify-center p-4 py-10">
      <Auth path={path} />
    </main>
  );
}
