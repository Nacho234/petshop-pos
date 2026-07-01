import { z } from "zod";

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

export const customerListParamsSchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type CustomerListParams = z.infer<typeof customerListParamsSchema>;

export type PetDTO = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  birthdate: string | null;
  notes: string | null;
};

export type CustomerDTO = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  points: number;
  petsCount: number;
};

export type CustomerDetailDTO = CustomerDTO & { pets: PetDTO[] };

export type CustomerListResult = {
  items: CustomerDTO[];
  total: number;
  page: number;
  pageSize: number;
};
