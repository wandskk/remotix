import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/server/permissions/session";
import * as gatewayService from "@/server/services/gateway-service";

export async function GET() {
  try {
    await requireAdmin();
    const gateways = await gatewayService.listGateways();
    return apiOk(gateways);
  } catch (error) {
    return apiError(error);
  }
}
