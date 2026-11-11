import { viewPaths } from "@better-auth-ui/core";
import { notFound } from "next/navigation";

import { Settings } from "@/components/auth/settings/settings";

const validPaths = new Set(Object.values(viewPaths.settings));

export function generateStaticParams() {
  return [...validPaths].map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  if (!validPaths.has(path)) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 py-6 sm:p-6">
      <Settings path={path} />
    </main>
  );
}
