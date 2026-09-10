import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { updateClientUserSchema } from "@/lib/validation/user";
import { requireAdmin } from "@/server/permissions/session";
import * as userService from "@/server/services/user-service";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id, userId } = await params;
    const input = updateClientUserSchema.parse(await request.json());
    const user = await userService.updateClientUser(id, userId, input, actor);
    return apiOk(user);
  } catch (error) {
    return apiError(error);
  }
}
