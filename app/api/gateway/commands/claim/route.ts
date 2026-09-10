import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { claimCommandSchema } from "@/lib/validation/command";
import * as commandService from "@/server/services/command-service";

export async function POST(request: NextRequest) {
  try {
    const input = claimCommandSchema.parse(await request.json());
    const command = await commandService.claimNextCommand(input);

    if (!command) return apiOk({ command: null });

    return apiOk({
      command: {
        id: command.id,
        type: command.type,
        destination: command.destination,
        message: command.message,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
