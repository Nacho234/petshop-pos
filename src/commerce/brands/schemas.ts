import { z } from "zod";

export const brandInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
});

export type BrandInput = z.infer<typeof brandInputSchema>;

export type BrandDTO = {
  id: string;
  name: string;
};
