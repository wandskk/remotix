import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { createCommandSchema } from "@/lib/validation/command";
import { requireSession } from "@/server/permissions/session";
import * as commandService from "@/server/services/command-service";

export async function GET() {
  try {
    const actor = await requireSession();
    const commands = await commandService.listCommandsForActor(actor);
    return apiOk(commands);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSession();
    const input = createCommandSchema.parse(await request.json());
    const command = await commandService.createCommand(input, actor);
    return apiOk(command, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
