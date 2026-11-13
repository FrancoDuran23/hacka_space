import { Auth } from "@/components/auth/auth";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 py-10">
      <Auth view="signIn" />
      <div className="w-full max-w-sm rounded-lg border p-4 text-sm">
        <p className="font-medium">Cuenta de ejemplo para probar la app</p>
        <p className="mt-2 text-muted-foreground">
          Email: <code className="select-all text-foreground">roscosmos@orbitclear-demo.test</code>
        </p>
        <p className="text-muted-foreground">
          Contraseña: <code className="select-all text-foreground">EMvKIApOVUPHCrRd</code>
        </p>
      </div>
    </main>
  );
}
