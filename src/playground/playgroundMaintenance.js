export function isMaintenanceOn(flag) {
  return String(flag ?? "on").trim().toLowerCase() !== "off";
}

export const PLAYGROUND_MAINTENANCE = isMaintenanceOn(import.meta.env?.VITE_PLAYGROUND_MAINTENANCE);
