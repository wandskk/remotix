import type { DeviceType } from "@/generated/prisma/enums";

// O frontend nunca escolhe o texto do SMS diretamente para operações
// críticas — só a `action` do catálogo. O backend resolve o SMS
// (docs/sms-protocol.md#catálogo-de-comandos).
export type CommandCatalogEntry = {
  action: string;
  label: string;
  sms: string;
};

export const COMMAND_CATALOG: Record<DeviceType, CommandCatalogEntry[]> = {
  GATE: [
    { action: "GATE_OPEN", label: "Abrir portão", sms: "PORTAO_ABRIR" },
    { action: "GATE_CLOSE", label: "Fechar portão", sms: "PORTAO_FECHAR" },
  ],
  LIGHT: [
    { action: "LIGHT_ON", label: "Ligar iluminação", sms: "LUZ_ON" },
    { action: "LIGHT_OFF", label: "Desligar iluminação", sms: "LUZ_OFF" },
  ],
  PUMP: [
    { action: "PUMP_ON", label: "Ligar bomba", sms: "BOMBA_ON" },
    { action: "PUMP_OFF", label: "Desligar bomba", sms: "BOMBA_OFF" },
  ],
  ALARM: [
    { action: "ALARM_ON", label: "Ativar alarme", sms: "ALARME_ON" },
    { action: "ALARM_OFF", label: "Desativar alarme", sms: "ALARME_OFF" },
  ],
  OTHER: [],
};

export function getCommandCatalogForDevice(type: DeviceType): CommandCatalogEntry[] {
  return COMMAND_CATALOG[type];
}

export function findCatalogEntry(type: DeviceType, action: string): CommandCatalogEntry | undefined {
  return COMMAND_CATALOG[type].find((entry) => entry.action === action);
}
