import { prisma } from "@/lib/db/prisma";

export function findOutboundByCommand(commandId: string) {
  return prisma.smsMessage.findFirst({
    where: { commandId, direction: "OUTBOUND" },
  });
}

export function createOutboundSms(data: {
  commandId: string;
  gatewayId: string;
  phoneNumber: string;
  message: string;
}) {
  return prisma.smsMessage.create({
    data: { ...data, direction: "OUTBOUND", status: "SENT" },
  });
}
