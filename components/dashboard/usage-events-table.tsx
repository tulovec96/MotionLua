import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface UsageEventRow {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  toolCalls: number;
  totalUnits: number;
  createdAt: string | Date;
}

export function UsageEventsTable({ events }: { events: UsageEventRow[] }) {
  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No usage yet — start a chat to see events here.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Input</TableHead>
          <TableHead>Output</TableHead>
          <TableHead>Reasoning</TableHead>
          <TableHead>Tool calls</TableHead>
          <TableHead className="text-right">Units</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="text-muted-foreground">
              {new Date(e.createdAt).toLocaleString()}
            </TableCell>
            <TableCell className="font-mono text-xs">{e.model}</TableCell>
            <TableCell>{e.inputTokens}</TableCell>
            <TableCell>{e.outputTokens}</TableCell>
            <TableCell>{e.reasoningTokens}</TableCell>
            <TableCell>{e.toolCalls}</TableCell>
            <TableCell className="text-right font-mono">{e.totalUnits}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
