import { Auth } from "@/components/auth/auth";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4 py-10">
      <Auth view="signIn" />
    </main>
  );
}
