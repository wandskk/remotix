import { z } from "zod";

const deviceTypeSchema = z.enum(["GATE", "LIGHT", "PUMP", "ALARM", "OTHER"]);

export const createDeviceSchema = z.object({
  gatewayId: z.string().min(1),
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  type: deviceTypeSchema,
});

export const updateDeviceSchema = z.object({
  gatewayId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  type: deviceTypeSchema.optional(),
  active: z.boolean().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
