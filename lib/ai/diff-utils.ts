import { diffLines } from "diff";

export interface DiffLine {
  type: "add" | "remove";
  text: string;
}

export interface ComputedDiff {
  added: number;
  removed: number;
  /** Only the changed (add/remove) lines — no unchanged context, by design. */
  visibleLines: DiffLine[];
  /** Set when added+removed exceeds 25: visibleLines holds first 10 + last 10. */
  hiddenCount: number;
}

const COMPRESS_THRESHOLD = 25;
const EDGE_LINES = 10;

/**
 * Reduces a before/after file pair to just its changed lines (no unchanged
 * context — the step-card UI is a condensed patch view, not a full diff
 * viewer), compressing to the first/last 10 changed lines once the total
 * exceeds 25.
 */
export function computeDiff(oldContent: string, newContent: string): ComputedDiff {
  const parts = diffLines(oldContent, newContent);
  const lines: DiffLine[] = [];

  for (const part of parts) {
    if (!part.added && !part.removed) continue;
    const type = part.added ? "add" : "remove";
    const partLines = part.value.split("\n");
    // split("\n") on a trailing-newline-terminated value yields one empty
    // trailing entry — drop it so we don't count a phantom blank line.
    if (partLines[partLines.length - 1] === "") partLines.pop();
    for (const text of partLines) {
      lines.push({ type, text });
    }
  }

  const added = lines.filter((l) => l.type === "add").length;
  const removed = lines.filter((l) => l.type === "remove").length;
  const total = added + removed;

  if (total <= COMPRESS_THRESHOLD) {
    return { added, removed, visibleLines: lines, hiddenCount: 0 };
  }

  const visibleLines = [...lines.slice(0, EDGE_LINES), ...lines.slice(-EDGE_LINES)];
  return { added, removed, visibleLines, hiddenCount: total - EDGE_LINES * 2 };
}
