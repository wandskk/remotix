import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { reportCommandFailureSchema } from "@/lib/validation/command";
import * as commandService from "@/server/services/command-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const input = reportCommandFailureSchema.parse(await request.json());
    const command = await commandService.markCommandFailed(id, input);
    return apiOk({ status: command.status, attempts: command.attempts });
  } catch (error) {
    return apiError(error);
  }
}
