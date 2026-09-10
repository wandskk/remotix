import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { updateDeviceCommandSchema } from "@/lib/validation/device-command";
import { requireAdmin } from "@/server/permissions/session";
import * as deviceCommandService from "@/server/services/device-command-service";

type RouteParams = { params: Promise<{ id: string; deviceCommandId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { deviceCommandId } = await params;
    const input = updateDeviceCommandSchema.parse(await request.json());
    const deviceCommand = await deviceCommandService.updateDeviceCommand(deviceCommandId, input, actor);
    return apiOk(deviceCommand);
  } catch (error) {
    return apiError(error);
  }
}
