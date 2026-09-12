import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { formatPriceCents, formatTokens, type PlanDefinition } from "@/lib/tokens/pricing";
import { cn } from "@/lib/utils";

export function PlanCard({ plan, current }: { plan: PlanDefinition; current: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        current ? "border-violet-500/50 bg-violet-500/5" : "border-border/60 bg-card/60"
      )}
    >
      {current ? (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
          Current plan
        </Badge>
      ) : null}
      <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-heading text-2xl font-semibold">{formatPriceCents(plan.priceMonthlyCents)}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatTokens(plan.monthlyTokens)} tokens · {plan.modelLabel}
      </p>
      <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
      {current || plan.id === "FREE" ? (
        <div className="mt-5 rounded-lg border border-border/60 py-2 text-center text-xs text-muted-foreground">
          {current ? "Active" : "Downgrade by cancelling in Manage subscription"}
        </div>
      ) : (
        <CheckoutButton type="plan" id={plan.id} className="mt-5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
          Switch to {plan.name}
        </CheckoutButton>
      )}
    </div>
  );
}
