import Stripe from "stripe";

export function hasStripeKeys(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

interface CheckoutParams {
  customerId?: string | null;
  customerEmail?: string;
  mode: "subscription" | "payment";
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface BillingClient {
  createCheckoutSession(params: CheckoutParams): Promise<{ url: string }>;
  createPortalSession(params: { customerId: string; returnUrl: string }): Promise<{ url: string }>;
}

class RealBillingClient implements BillingClient {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  get raw() {
    return this.stripe;
  }

  async createCheckoutSession(params: CheckoutParams) {
    const session = await this.stripe.checkout.sessions.create({
      mode: params.mode,
      customer: params.customerId ?? undefined,
      customer_email: params.customerId ? undefined : params.customerEmail,
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: params.mode === "subscription" ? { metadata: params.metadata } : undefined,
    });
    return { url: session.url! };
  }

  async createPortalSession(params: { customerId: string; returnUrl: string }) {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
    return { url: session.url };
  }
}

/**
 * Fake checkout flow used whenever STRIPE_SECRET_KEY is unset: resolves
 * instantly to a URL that lands back on the billing page with a
 * `mock_success` flag, so the upgrade/top-up UX is fully demoable with no
 * real Stripe account. No charge, no webhook — the billing page itself
 * applies the mock purchase directly when it sees the flag.
 */
class MockBillingClient implements BillingClient {
  async createCheckoutSession(params: CheckoutParams) {
    const url = new URL(params.successUrl);
    url.searchParams.set("mock_success", "1");
    for (const [key, value] of Object.entries(params.metadata)) {
      url.searchParams.set(key, value);
    }
    return { url: url.toString() };
  }

  async createPortalSession(params: { returnUrl: string }) {
    return { url: params.returnUrl };
  }
}

let cachedClient: BillingClient | null = null;

export function getBillingClient(): BillingClient {
  if (cachedClient) return cachedClient;
  cachedClient = hasStripeKeys()
    ? new RealBillingClient(process.env.STRIPE_SECRET_KEY!)
    : new MockBillingClient();
  return cachedClient;
}

export function getStripeRaw(): Stripe | null {
  const client = getBillingClient();
  return client instanceof RealBillingClient ? client.raw : null;
}
