import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/server/permissions/session";
import * as gatewayService from "@/server/services/gateway-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const gateway = await gatewayService.regenerateActivationCode(id, actor);
    return apiOk(gateway);
  } catch (error) {
    return apiError(error);
  }
}
