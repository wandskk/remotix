import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { registerGatewaySchema } from "@/lib/validation/gateway";
import * as gatewayService from "@/server/services/gateway-service";

export async function POST(request: NextRequest) {
  try {
    const input = registerGatewaySchema.parse(await request.json());
    const result = await gatewayService.registerGateway(input);
    return apiOk(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
