import { Coins, Gauge, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { maybeResetCycle } from "@/lib/tokens/cycle";
import { StatCard } from "@/components/dashboard/stat-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { UsageEventsTable } from "@/components/dashboard/usage-events-table";
import { CycleProgress } from "@/components/billing/cycle-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTokens, PLAN_DEFINITIONS, type PlanId } from "@/lib/tokens/pricing";

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser();
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser!.id } });
  const user = await maybeResetCycle(dbUser);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const events = await prisma.usageEvent.findMany({
    where: { userId: user.id, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const byDay = new Map<string, number>();
  for (const event of events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + event.totalUnits);
  }
  const daily = Array.from(byDay.entries())
    .map(([date, units]) => ({ date, units }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const plan = PLAN_DEFINITIONS.find((p) => p.id === (user.plan as PlanId)) ?? PLAN_DEFINITIONS[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Usage dashboard</h1>
        <p className="text-sm text-muted-foreground">Your token balance and recent activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Balance"
          value={formatTokens(user.tokenBalance)}
          sub="tokens available"
          icon={<Coins className="size-4 text-violet-400" />}
        />
        <StatCard
          label="Plan"
          value={plan.name}
          sub={plan.modelLabel}
          icon={<Sparkles className="size-4 text-violet-400" />}
        />
        <StatCard
          label="Rollover"
          value={formatTokens(user.rolloverTokens)}
          sub="carried into this cycle"
          icon={<Gauge className="size-4 text-violet-400" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <CycleProgress used={user.monthlyUsed} allocation={user.monthlyAllocation} cycleEnd={user.cycleEnd} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageChart data={daily} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent usage</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageEventsTable events={events.slice(0, 10)} />
        </CardContent>
      </Card>
    </div>
  );
}
