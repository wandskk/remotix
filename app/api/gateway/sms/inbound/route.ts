import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { inboundSmsSchema } from "@/lib/validation/command";
import * as commandService from "@/server/services/command-service";

export async function POST(request: NextRequest) {
  try {
    const input = inboundSmsSchema.parse(await request.json());
    const result = await commandService.processInboundSms(input);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
