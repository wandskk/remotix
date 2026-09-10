import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { updateGatewaySchema } from "@/lib/validation/gateway";
import { requireAdmin } from "@/server/permissions/session";
import * as gatewayService from "@/server/services/gateway-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const gateway = await gatewayService.getGatewayOrThrow(id);
    return apiOk(gateway);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const input = updateGatewaySchema.parse(await request.json());
    const gateway = await gatewayService.updateGateway(id, input, actor);
    return apiOk(gateway);
  } catch (error) {
    return apiError(error);
  }
}
