import { z } from "zod";

export const createGatewaySchema = z.object({
  name: z.string().min(1),
  simPhone: z.string().min(1).optional(),
});

export const updateGatewaySchema = z.object({
  name: z.string().min(1).optional(),
  simPhone: z.string().min(1).optional(),
});

export const registerGatewaySchema = z.object({
  activationCode: z.string().min(1),
  deviceUid: z.string().min(1),
  appVersion: z.string().min(1).optional(),
});

export const gatewayCredentialsSchema = z.object({
  deviceUid: z.string().min(1),
  secret: z.string().min(1),
});

export const heartbeatSchema = gatewayCredentialsSchema.extend({
  batteryLevel: z.number().int().min(0).max(100).optional(),
  networkType: z.string().min(1).optional(),
  appVersion: z.string().min(1).optional(),
});

export type CreateGatewayInput = z.infer<typeof createGatewaySchema>;
export type UpdateGatewayInput = z.infer<typeof updateGatewaySchema>;
export type RegisterGatewayInput = z.infer<typeof registerGatewaySchema>;
export type GatewayCredentialsInput = z.infer<typeof gatewayCredentialsSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
