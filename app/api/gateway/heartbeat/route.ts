import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { heartbeatSchema } from "@/lib/validation/gateway";
import * as gatewayService from "@/server/services/gateway-service";

export async function POST(request: NextRequest) {
  try {
    const input = heartbeatSchema.parse(await request.json());
    const gateway = await gatewayService.recordHeartbeat(input);
    return apiOk({ status: gateway.status, lastSeenAt: gateway.lastSeenAt });
  } catch (error) {
    return apiError(error);
  }
}
