import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/server/permissions/session";
import * as deviceService from "@/server/services/device-service";

export async function GET() {
  try {
    await requireAdmin();
    const devices = await deviceService.listDevices();
    return apiOk(devices);
  } catch (error) {
    return apiError(error);
  }
}
