import { getStripeRaw } from "@/lib/billing/stripe";
import { handleStripeEvent } from "@/lib/billing/webhooks";

export async function POST(req: Request) {
  const stripe = getStripeRaw();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.warn(
      "[stripe webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is unset — skipping signature " +
        "verification and ignoring this event. Purchases in mock mode are applied directly from " +
        "the billing page instead (see lib/billing/webhooks.ts's applyMockPurchase)."
    );
    return new Response("Webhook not configured", { status: 200 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  await handleStripeEvent(event);
  return new Response("ok", { status: 200 });
}
