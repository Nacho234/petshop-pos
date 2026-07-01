// Configuración estática de la aplicación (no secretos).

export const APP_CONFIG = {
  name: "Zafari",
  defaultCurrency: "ARS",
  defaultLocale: "es-AR",
  // Roles y sus permisos de alto nivel. El ADMIN accede a todo; el EMPLEADO
  // sólo al POS y ventas. Se aplica en los guards de auth (paso 2).
  roleAccess: {
    ADMIN: "all",
    EMPLEADO: ["pos", "ventas"],
  },
} as const;
