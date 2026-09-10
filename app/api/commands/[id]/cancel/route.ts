import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { requireSession } from "@/server/permissions/session";
import * as commandService from "@/server/services/command-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const actor = await requireSession();
    const { id } = await params;
    const command = await commandService.cancelCommand(id, actor);
    return apiOk(command);
  } catch (error) {
    return apiError(error);
  }
}
