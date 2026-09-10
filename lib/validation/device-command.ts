import { z } from "zod";

// O "#" é reservado para o nonce de correlação (docs/sms-protocol.md) —
// o texto configurado pelo admin nunca pode conter esse caractere.
const smsTextSchema = z
  .string()
  .min(1)
  .refine((value) => !value.includes("#"), "O texto do SMS não pode conter '#'.");

export const createDeviceCommandSchema = z.object({
  label: z.string().min(1),
  sms: smsTextSchema,
});

export const updateDeviceCommandSchema = z.object({
  label: z.string().min(1).optional(),
  sms: smsTextSchema.optional(),
  active: z.boolean().optional(),
});

export type CreateDeviceCommandInput = z.infer<typeof createDeviceCommandSchema>;
export type UpdateDeviceCommandInput = z.infer<typeof updateDeviceCommandSchema>;
