"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/marketing/animate-in";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RobloxSignInButton } from "@/components/layout/roblox-sign-in-button";
import { PLAN_DEFINITIONS, TOKEN_PACKS, formatPriceCents, formatTokens } from "@/lib/tokens/pricing";
import { cn } from "@/lib/utils";

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mb-4 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Simple, token-based pricing</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Every request consumes tokens. Pick a monthly plan, or top up as you go.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className={cn(!annual && "text-foreground", annual && "text-muted-foreground")}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className={cn(annual && "text-foreground", !annual && "text-muted-foreground")}>
            Annual <span className="text-emerald-400">(save 20%)</span>
          </span>
        </div>
      </Reveal>

      <StaggerGroup className="grid gap-5 sm:grid-cols-3">
        {PLAN_DEFINITIONS.map((plan) => {
          const price = annual ? plan.priceAnnualCents / 12 : plan.priceMonthlyCents;
          return (
            <StaggerItem key={plan.id}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-6 transition-transform hover:-translate-y-0.5",
                  plan.highlight
                    ? "border-transparent bg-gradient-to-b from-violet-500/10 to-transparent [background-clip:padding-box] shadow-[0_0_0_1px_theme(colors.violet.500/40%)]"
                    : "border-border/60 bg-card/60"
                )}
              >
                {plan.highlight ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                    Most popular
                  </Badge>
                ) : null}
                <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-heading text-3xl font-semibold">
                    {formatPriceCents(Math.round(price))}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTokens(plan.monthlyTokens)} tokens · {plan.modelLabel}
                </p>
                <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
                <RobloxSignInButton
                  size="lg"
                  showMark={false}
                  label={plan.priceMonthlyCents === 0 ? "Start building free" : `Get ${plan.name}`}
                  className={cn(
                    "mt-6 w-full",
                    !plan.highlight && "bg-none bg-secondary text-secondary-foreground hover:opacity-100 hover:bg-secondary/80"
                  )}
                />
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      <Reveal className="mt-16">
        <h3 className="mb-6 text-center font-heading text-xl font-semibold">Need more tokens? Top up anytime.</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          {TOKEN_PACKS.map((pack) => (
            <div key={pack.id} className="rounded-xl border border-border/60 bg-card/60 p-5 text-center">
              <div className="font-heading text-base font-semibold">{pack.name}</div>
              <div className="mt-2 font-heading text-2xl font-semibold">
                {formatPriceCents(pack.priceCents)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatTokens(pack.tokens)} tokens
                {pack.bonusPct > 0 ? ` · +${Math.round(pack.bonusPct * 100)}% bonus` : ""}
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full" disabled>
                Buy pack
              </Button>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
