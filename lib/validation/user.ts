import { z } from "zod";

// Sem senha aqui — o cliente nunca recebe uma senha definida pelo admin,
// ele define a própria via link de convite (docs/product-overview.md#onboarding).
export const createClientUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const updateClientUserSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export const acceptInviteSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type CreateClientUserInput = z.infer<typeof createClientUserSchema>;
export type UpdateClientUserInput = z.infer<typeof updateClientUserSchema>;
