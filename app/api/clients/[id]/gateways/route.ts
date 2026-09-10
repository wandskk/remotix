import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { createGatewaySchema } from "@/lib/validation/gateway";
import { requireAdmin } from "@/server/permissions/session";
import * as clientService from "@/server/services/client-service";
import * as gatewayService from "@/server/services/gateway-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    await clientService.getClientOrThrow(id);
    const gateways = await gatewayService.listClientGateways(id);
    return apiOk(gateways);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    await clientService.getClientOrThrow(id);
    const input = createGatewaySchema.parse(await request.json());
    const gateway = await gatewayService.createGateway(id, input, actor);
    return apiOk(gateway, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
