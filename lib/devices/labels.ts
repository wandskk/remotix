import type { DeviceType } from "@/generated/prisma/enums";

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  GATE: "Portão",
  LIGHT: "Iluminação",
  PUMP: "Bomba",
  ALARM: "Alarme",
  OTHER: "Outro",
};

export const DEVICE_TYPES: DeviceType[] = ["GATE", "LIGHT", "PUMP", "ALARM", "OTHER"];

export const DEVICE_TYPE_ICONS: Record<DeviceType, string> = {
  GATE: "🚪",
  LIGHT: "💡",
  PUMP: "⚙️",
  ALARM: "🔔",
  OTHER: "📟",
};
