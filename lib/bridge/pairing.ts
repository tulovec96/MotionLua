/** A short, human-typeable code — entered once into the Studio plugin's pairing field. */
export function generatePairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** A paired session is considered dropped once its heartbeat goes stale. */
export const HEARTBEAT_STALE_MS = 30_000;

export function isSessionLive(lastHeartbeatAt: Date | null): boolean {
  if (!lastHeartbeatAt) return false;
  return Date.now() - lastHeartbeatAt.getTime() < HEARTBEAT_STALE_MS;
}
