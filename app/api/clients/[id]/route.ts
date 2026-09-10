import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { updateClientSchema } from "@/lib/validation/client";
import { requireAdmin } from "@/server/permissions/session";
import * as clientService from "@/server/services/client-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const client = await clientService.getClientOrThrow(id);
    return apiOk(client);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const input = updateClientSchema.parse(await request.json());
    const client = await clientService.updateClient(id, input, actor);
    return apiOk(client);
  } catch (error) {
    return apiError(error);
  }
}
