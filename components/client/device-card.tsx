import { triggerCommandAction } from "@/app/client/actions";
import { CommandStatusBadge } from "@/components/status/command-status-badge";
import { DEVICE_TYPE_ICONS, DEVICE_TYPE_LABELS } from "@/lib/devices/labels";
import type { CommandStatus, DeviceType } from "@/generated/prisma/enums";

type Device = { id: string; name: string; type: DeviceType; active: boolean };
type LatestCommand = { status: CommandStatus } | undefined;
type DeviceCommand = { id: string; label: string };

export function DeviceCard({
  device,
  deviceCommands,
  latestCommand,
}: {
  device: Device;
  deviceCommands: DeviceCommand[];
  latestCommand: LatestCommand;
}) {
  return (
    <div className="w-full max-w-sm rounded-lg border border-black/10 p-4 dark:border-white/20">
      <h3 className="mb-1 font-medium">
        {DEVICE_TYPE_ICONS[device.type]} {device.name}
      </h3>
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
        {DEVICE_TYPE_LABELS[device.type]}
      </p>

      {!device.active ? (
        <p className="text-sm text-red-700 dark:text-red-500">Dispositivo desativado.</p>
      ) : deviceCommands.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum comando disponível.</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2">
          {deviceCommands.map((dc) => (
            <form key={dc.id} action={triggerCommandAction}>
              <input type="hidden" name="deviceId" value={device.id} />
              <input type="hidden" name="deviceCommandId" value={dc.id} />
              <button
                type="submit"
                className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                {dc.label}
              </button>
            </form>
          ))}
        </div>
      )}

      {latestCommand && (
        <p className="text-sm">
          <CommandStatusBadge status={latestCommand.status} />
        </p>
      )}
    </div>
  );
}
