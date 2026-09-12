export interface BridgeCommandOutcome {
  status: "ACKED" | "FAILED";
  result?: unknown;
  error?: string;
}

export interface QueuedCommand {
  id: string;
  type: string;
  payload: unknown;
}
