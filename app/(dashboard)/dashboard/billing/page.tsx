import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasStripeKeys } from "@/lib/billing/stripe";
import { applyMockPurchase } from "@/lib/billing/webhooks";
import { PLAN_DEFINITIONS, TOKEN_PACKS, type PlanId } from "@/lib/tokens/pricing";
import { PlanCard } from "@/components/billing/plan-card";
import { TokenPackCard } from "@/components/billing/token-pack-card";
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ mock_success?: string; type?: string; planId?: string; packId?: string }>;
}) {
  const sessionUser = await getCurrentUser();
  const params = await searchParams;

  if (params.mock_success === "1" && !hasStripeKeys()) {
    await applyMockPurchase({
      userId: sessionUser!.id,
      type: params.type === "pack" ? "pack" : "plan",
      planId: params.planId,
      packId: params.packId,
    });
    redirect("/dashboard/billing");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser!.id } });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            {hasStripeKeys() ? "Manage your plan and payment methods." : "Stripe isn't configured — purchases here are simulated."}
          </p>
        </div>
        <ManageSubscriptionButton />
      </div>

      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} current={plan.id === (user.plan as PlanId)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">Token packs</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {TOKEN_PACKS.map((pack) => (
            <TokenPackCard key={pack.id} pack={pack} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current balance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {user.tokenBalance.toLocaleString()} tokens available.
        </CardContent>
      </Card>
    </div>
  );
}
