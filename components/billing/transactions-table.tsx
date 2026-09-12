import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatTokens } from "@/lib/tokens/pricing";

export interface TransactionRow {
  id: string;
  type: string;
  amountCents: number;
  tokensGranted: number;
  status: string;
  createdAt: string | Date;
}

export function TransactionsTable({ transactions }: { transactions: TransactionRow[] }) {
  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-muted-foreground">
              {new Date(t.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="capitalize">{t.type.replace("_", " ").toLowerCase()}</TableCell>
            <TableCell>${(t.amountCents / 100).toFixed(2)}</TableCell>
            <TableCell>+{formatTokens(t.tokensGranted)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {t.status.toLowerCase()}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
