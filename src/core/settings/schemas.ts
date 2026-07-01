import { z } from "zod";

export const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "El nombre del negocio es obligatorio").max(120),
  legalName: z.string().trim().max(160).optional().or(z.literal("")),
  taxId: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  currency: z.string().trim().min(1).max(8).default("ARS"),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export type SettingsDTO = {
  businessName: string;
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
};
