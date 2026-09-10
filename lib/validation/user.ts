import { z } from "zod";

export const createClientUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const updateClientUserSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
  active: z.boolean().optional(),
});

export type CreateClientUserInput = z.infer<typeof createClientUserSchema>;
export type UpdateClientUserInput = z.infer<typeof updateClientUserSchema>;
