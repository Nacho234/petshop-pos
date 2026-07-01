import { z } from "zod";

export const petInputSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  species: z.string().trim().max(40).optional().or(z.literal("")),
  breed: z.string().trim().max(60).optional().or(z.literal("")),
  // Fecha en formato YYYY-MM-DD (del input date), opcional.
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
export type PetInput = z.infer<typeof petInputSchema>;
