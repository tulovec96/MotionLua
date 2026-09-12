"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2, PlugZap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPairingCode } from "@/lib/bridge/actions";

interface Status {
  paired: boolean;
  pairingCode?: string;
  status?: "pending" | "connected" | "disconnected";
  placeName?: string | null;
}

export function PluginPairing() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch("/api/bridge/status");
      if (!cancelled && res.ok) setStatus(await res.json());
    }
    const id = setInterval(poll, 3000);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  function handleGenerate() {
    startTransition(async () => {
      const code = await createPairingCode();
      setStatus({ paired: true, pairingCode: code, status: "pending" });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {status?.paired && status.status === "connected" ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <CheckCircle2 className="size-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Connected</p>
            <p className="text-xs text-muted-foreground">{status.placeName ?? "Roblox Studio"} is paired.</p>
          </div>
        </div>
      ) : status?.paired ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border/60 bg-card/60 px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pairing code</p>
          <p className="font-mono text-4xl font-semibold tracking-widest">{status.pairingCode}</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {status.status === "disconnected" ? (
              "Disconnected — enter this code in the plugin again."
            ) : (
              <>
                <Loader2 className="size-3 animate-spin" />
                Waiting for Studio to connect…
              </>
            )}
          </p>
          <Button onClick={handleGenerate} disabled={pending} variant="outline" size="sm" className="mt-2 gap-2">
            <RefreshCw className="size-3.5" />
            Generate a new code
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 px-6 py-10 text-center">
          <PlugZap className="size-6 text-violet-400" />
          <p className="text-sm text-muted-foreground">No plugin paired yet.</p>
          <Button onClick={handleGenerate} disabled={pending} className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Generate pairing code
          </Button>
        </div>
      )}
      <Badge variant="outline" className="w-fit text-[11px] text-muted-foreground">
        Install the plugin from the Roblox Studio plugin marketplace first, then paste the code above into it.
      </Badge>
    </div>
  );
}
