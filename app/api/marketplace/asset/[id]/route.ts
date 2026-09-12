import { getCurrentUser } from "@/lib/auth/session";
import { getCatalogItemDetails } from "@/lib/marketplace/catalog-client";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const item = await getCatalogItemDetails(id);
  return Response.json(item);
}
