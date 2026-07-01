import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/core/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Borde de seguridad: toda ruta bajo (app) exige sesión.
  const user = await requireAuth();

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role ?? "EMPLEADO" }}
    >
      {children}
    </AppShell>
  );
}
