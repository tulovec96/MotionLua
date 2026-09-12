import { CheckoutButton } from "@/components/billing/checkout-button";
import { formatPriceCents, formatTokens, type TokenPack } from "@/lib/tokens/pricing";

export function TokenPackCard({ pack }: { pack: TokenPack }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 text-center">
      <div className="font-heading text-base font-semibold">{pack.name}</div>
      <div className="mt-2 font-heading text-2xl font-semibold">{formatPriceCents(pack.priceCents)}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {formatTokens(pack.tokens)} tokens
        {pack.bonusPct > 0 ? ` · +${Math.round(pack.bonusPct * 100)}% bonus` : ""}
      </div>
      <CheckoutButton type="pack" id={pack.id} variant="outline" className="mt-4">
        Buy pack
      </CheckoutButton>
    </div>
  );
}
