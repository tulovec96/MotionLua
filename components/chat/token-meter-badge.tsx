import Link from "next/link";
import { Coins } from "lucide-react";
import { formatTokens } from "@/lib/tokens/pricing";
import { cn } from "@/lib/utils";

export function TokenMeterBadge({ balance }: { balance: number | null }) {
  const low = balance !== null && balance < 5000;
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs transition-colors",
        low ? "border-amber-500/40 text-amber-400" : "border-border/60 text-muted-foreground hover:text-foreground"
      )}
    >
      <Coins className="size-3.5" />
      {balance === null ? "—" : `${formatTokens(balance)} tokens`}
    </Link>
  );
}
