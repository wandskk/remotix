import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1),
  document: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  document: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
