// Control de acceso por rol. Fuente única de verdad para qué rol ve qué.
// ADMIN accede a todo. EMPLEADO sólo a POS y ventas.

export type Role = "ADMIN" | "EMPLEADO";

export type AppSection =
  | "dashboard"
  | "productos"
  | "categorias"
  | "marcas"
  | "pos"
  | "ventas"
  | "caja"
  | "reportes"
  | "settings";

const EMPLEADO_SECTIONS: readonly AppSection[] = ["pos", "ventas"];

export function canAccess(
  role: string | null | undefined,
  section: AppSection
): boolean {
  if (role === "ADMIN") return true;
  if (role === "EMPLEADO") return EMPLEADO_SECTIONS.includes(section);
  return false;
}
