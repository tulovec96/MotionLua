import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getBillingClient } from "@/lib/billing/stripe";
import { planPriceId, packPriceId } from "@/lib/billing/plans";
import { PLAN_DEFINITIONS, TOKEN_PACKS, type PlanId } from "@/lib/tokens/pricing";

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return new Response("Unauthorized", { status: 401 });
  // Session/JWT fields are a snapshot from sign-in; billing needs the live row.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  const { type, id } = (await req.json()) as { type: "plan" | "pack"; id: string };
  const origin = new URL(req.url).origin;
  const cancelUrl = `${origin}/dashboard/billing`;

  const client = getBillingClient();

  if (type === "plan") {
    const plan = PLAN_DEFINITIONS.find((p) => p.id === (id as PlanId));
    if (!plan || plan.id === "FREE") return new Response("Invalid plan", { status: 400 });

    const priceId = planPriceId(plan.id as Exclude<PlanId, "FREE">) ?? "mock-price";
    const { url } = await client.createCheckoutSession({
      customerId: user.stripeCustomerId,
      customerEmail: undefined,
      mode: "subscription",
      priceId,
      successUrl: `${origin}/dashboard/billing`,
      cancelUrl,
      metadata: { userId: user.id, type: "plan", planId: plan.id },
    });
    return Response.json({ url });
  }

  if (type === "pack") {
    const pack = TOKEN_PACKS.find((p) => p.id === id);
    if (!pack) return new Response("Invalid pack", { status: 400 });

    const priceId = packPriceId(pack.id) ?? "mock-price";
    const { url } = await client.createCheckoutSession({
      customerId: user.stripeCustomerId,
      customerEmail: undefined,
      mode: "payment",
      priceId,
      successUrl: `${origin}/dashboard/billing`,
      cancelUrl,
      metadata: { userId: user.id, type: "pack", packId: pack.id },
    });
    return Response.json({ url });
  }

  return new Response("Invalid request", { status: 400 });
}
