import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TransactionsTable } from "@/components/billing/transactions-table";
import { UsageEventsTable } from "@/components/dashboard/usage-events-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HistoryPage() {
  const sessionUser = await getCurrentUser();

  const [transactions, events] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: sessionUser!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.usageEvent.findMany({
      where: { userId: sessionUser!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">Transactions and per-request token usage.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={transactions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage events</CardTitle>
        </CardHeader>
        <CardContent>
          <UsageEventsTable events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
