import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { createClientUserSchema } from "@/lib/validation/user";
import { requireAdmin } from "@/server/permissions/session";
import * as clientService from "@/server/services/client-service";
import * as userService from "@/server/services/user-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;
    await clientService.getClientOrThrow(id);
    const users = await userService.listClientUsers(id);
    return apiOk(users);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireAdmin();
    const { id } = await params;
    await clientService.getClientOrThrow(id);
    const input = createClientUserSchema.parse(await request.json());
    const { user, inviteToken } = await userService.createClientUser(id, input, actor);
    return apiOk({ ...user, inviteUrl: `/convite/${inviteToken}` }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
