import { Progress } from "@/components/ui/progress";
import { formatTokens } from "@/lib/tokens/pricing";

export function CycleProgress({
  used,
  allocation,
  cycleEnd,
}: {
  used: number;
  allocation: number;
  cycleEnd: string | Date | null;
}) {
  const pct = allocation > 0 ? Math.min((used / allocation) * 100, 100) : 0;
  const resetDate = cycleEnd
    ? new Date(cycleEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatTokens(used)} / {formatTokens(allocation)} used this cycle
        </span>
        {resetDate ? <span>Resets {resetDate}</span> : null}
      </div>
      <Progress value={pct} />
    </div>
  );
}
