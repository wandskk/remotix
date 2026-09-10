import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { createDeviceCommandSchema } from "@/lib/validation/device-command";
import { requireAdmin } from "@/server/permissions/session";
import * as deviceCommandService from "@/server/services/device-command-service";
import * as deviceService from "@/server/services/device-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deviceService.getDeviceOrThrow(id);
    const deviceCommands = await deviceCommandService.listDeviceCommands(id);
    return apiOk(deviceCommands);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    await deviceService.getDeviceOrThrow(id);
    const input = createDeviceCommandSchema.parse(await request.json());
    const deviceCommand = await deviceCommandService.createDeviceCommand(id, input, actor);
    return apiOk(deviceCommand, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
