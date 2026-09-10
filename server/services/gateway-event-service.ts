import type { Prisma } from "@/generated/prisma/client";
import type { GatewayEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export function recordGatewayEvent(
  gatewayId: string,
  eventType: GatewayEventType,
  payload?: Record<string, unknown>,
) {
  return prisma.gatewayEvent.create({
    data: { gatewayId, eventType, payload: payload as Prisma.InputJsonValue | undefined },
  });
}
