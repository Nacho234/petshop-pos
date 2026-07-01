import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export type CategoryDTO = {
  id: string;
  name: string;
};
