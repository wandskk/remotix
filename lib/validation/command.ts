import { z } from "zod";

import { gatewayCredentialsSchema } from "@/lib/validation/gateway";

export const createCommandSchema = z.object({
  deviceId: z.string().min(1),
  action: z.string().min(1),
});

export const claimCommandSchema = gatewayCredentialsSchema;

export const reportCommandFailureSchema = gatewayCredentialsSchema.extend({
  errorCode: z.string().min(1).optional(),
  errorMessage: z.string().min(1).optional(),
});

export type CreateCommandInput = z.infer<typeof createCommandSchema>;
export type ReportCommandFailureInput = z.infer<typeof reportCommandFailureSchema>;
