import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { gatewayCredentialsSchema } from "@/lib/validation/gateway";
import * as gatewayService from "@/server/services/gateway-service";

export async function POST(request: NextRequest) {
  try {
    const input = gatewayCredentialsSchema.parse(await request.json());
    const gateway = await gatewayService.authenticateGateway(input);
    return apiOk({ gatewayId: gateway.id, name: gateway.name, clientId: gateway.clientId });
  } catch (error) {
    return apiError(error);
  }
}
