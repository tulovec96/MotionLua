export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Heuristic (regex-based) check against this app's mandatory Luau patterns
 * (see lib/ai/system-prompt.ts) — not a real Luau parser/type-checker. Good
 * enough to catch the common mistakes an LLM makes before a script gets
 * written into a place; a real static analyzer (e.g. a Luau-aware WASM
 * linter) is a reasonable follow-up, not required for this to be useful.
 */
export function validateLuau(source: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = source.split("\n");

  if (!source.trimStart().startsWith("--!strict")) {
    issues.push({ severity: "warning", message: "Missing --!strict at the top of the file." });
  }

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    if (/(?<![\w.:])wait\s*\(/.test(line)) {
      issues.push({ severity: "error", message: "Use task.wait() instead of the deprecated wait().", line: lineNo });
    }
    if (/(?<![\w.:])spawn\s*\(/.test(line)) {
      issues.push({ severity: "error", message: "Use task.spawn() instead of the deprecated spawn().", line: lineNo });
    }
    if (/(?<![\w.:])delay\s*\(/.test(line)) {
      issues.push({ severity: "error", message: "Use task.delay() instead of the deprecated delay().", line: lineNo });
    }
    if (/:remove\s*\(/.test(line)) {
      issues.push({ severity: "error", message: "Use :Destroy() instead of the deprecated :remove().", line: lineNo });
    }
    if (/game\.Workspace\b/.test(line)) {
      issues.push({
        severity: "warning",
        message: 'Use game:GetService("Workspace") instead of game.Workspace.',
        line: lineNo,
      });
    }
    if (/\bgame\.Players\b/.test(line)) {
      issues.push({
        severity: "warning",
        message: 'Use game:GetService("Players") instead of game.Players.',
        line: lineNo,
      });
    }
  });

  const hasError = issues.some((i) => i.severity === "error");
  return { valid: !hasError, issues };
}
