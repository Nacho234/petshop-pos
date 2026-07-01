import { redirect } from "next/navigation";
import Image from "next/image";

import { getSession } from "@/core/auth/session";
import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Si ya hay sesión, no mostramos el login.
  const session = await getSession();
  if (session) redirect("/pos");

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo-zafari.png" alt="Zafari" width={56} height={56} priority />
          <div>
            <h1 className="font-display text-2xl font-semibold text-fg">Zafari</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Ingresá para acceder al sistema
            </p>
          </div>
        </div>

        <Card className="p-6">
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
