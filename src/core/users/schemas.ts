import { z } from "zod";

export const ROLES = ["ADMIN", "EMPLEADO"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  EMPLEADO: "Empleado",
};

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
  role: z.enum(ROLES).default("EMPLEADO"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
};
