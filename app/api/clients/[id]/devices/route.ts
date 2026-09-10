import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { createDeviceSchema } from "@/lib/validation/device";
import { requireAdmin } from "@/server/permissions/session";
import * as clientService from "@/server/services/client-service";
import * as deviceService from "@/server/services/device-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    await clientService.getClientOrThrow(id);
    const devices = await deviceService.listClientDevices(id);
    return apiOk(devices);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    await clientService.getClientOrThrow(id);
    const input = createDeviceSchema.parse(await request.json());
    const device = await deviceService.createDevice(id, input, actor);
    return apiOk(device, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
