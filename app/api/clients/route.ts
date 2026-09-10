import type { NextRequest } from "next/server";

import { apiError, apiOk } from "@/lib/api/response";
import { createClientSchema } from "@/lib/validation/client";
import { requireAdmin } from "@/server/permissions/session";
import * as clientService from "@/server/services/client-service";

export async function GET() {
  try {
    await requireAdmin();
    const clients = await clientService.listClients();
    return apiOk(clients);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdmin();
    const input = createClientSchema.parse(await request.json());
    const client = await clientService.createClient(input, actor);
    return apiOk(client, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
