import { redirect } from "next/navigation";

import { DeviceCard } from "@/components/client/device-card";
import { GatewayStatusBadge } from "@/components/status/gateway-status-badge";
import { computeGatewayStatus } from "@/lib/gateways/status";
import { auth } from "@/lib/auth/auth";
import * as commandService from "@/server/services/command-service";
import * as deviceCommandService from "@/server/services/device-command-service";
import * as deviceService from "@/server/services/device-service";
import * as gatewayService from "@/server/services/gateway-service";

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session?.user?.clientId;
  if (!clientId) redirect("/login");

  const [gateways, devices] = await Promise.all([
    gatewayService.listClientGateways(clientId),
    deviceService.listClientDevices(clientId),
  ]);

  const devicesWithLatestCommand = await Promise.all(
    devices.map(async (device) => {
      const [commands, deviceCommands] = await Promise.all([
        commandService.listCommandsForDevice(device.id),
        deviceCommandService.listDeviceCommands(device.id),
      ]);
      return {
        device,
        latestCommand: commands[0],
        deviceCommands: deviceCommands.filter((dc) => dc.active),
      };
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold">Olá, {session?.user?.name}</h1>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Gateway</h2>
        {gateways.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum gateway configurado ainda.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {gateways.map((gateway) => (
              <div key={gateway.id} className="text-sm">
                {gateway.name} — <GatewayStatusBadge status={computeGatewayStatus(gateway.status, gateway.lastSeenAt)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">Equipamentos</h2>
        {devicesWithLatestCommand.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum equipamento cadastrado ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {devicesWithLatestCommand.map(({ device, deviceCommands, latestCommand }) => (
              <DeviceCard
                key={device.id}
                device={device}
                deviceCommands={deviceCommands}
                latestCommand={latestCommand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
