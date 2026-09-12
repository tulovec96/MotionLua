import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getBillingClient } from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const origin = new URL(req.url).origin;

  if (!user.stripeCustomerId) {
    return Response.json({ url: `${origin}/dashboard/billing` });
  }

  const client = getBillingClient();
  const { url } = await client.createPortalSession({
    customerId: user.stripeCustomerId,
    returnUrl: `${origin}/dashboard/billing`,
  });
  return Response.json({ url });
}
