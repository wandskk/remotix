import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { requireAdmin } from "@/server/permissions/session";
import * as userService from "@/server/services/user-service";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id, userId } = await params;
    const { inviteToken } = await userService.regenerateInvite(id, userId, actor);
    return apiOk({ inviteUrl: `/convite/${inviteToken}` });
  } catch (error) {
    return apiError(error);
  }
}
