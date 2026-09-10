import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { updateDeviceSchema } from "@/lib/validation/device";
import { requireAdmin } from "@/server/permissions/session";
import * as deviceService from "@/server/services/device-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    const device = await deviceService.getDeviceOrThrow(id);
    return apiOk(device);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    const input = updateDeviceSchema.parse(await request.json());
    const device = await deviceService.updateDevice(id, input, actor);
    return apiOk(device);
  } catch (error) {
    return apiError(error);
  }
}
