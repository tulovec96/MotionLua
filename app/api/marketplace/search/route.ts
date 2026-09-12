import { getCurrentUser } from "@/lib/auth/session";
import { searchCatalog } from "@/lib/marketplace/catalog-client";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? "";
  const assetType = url.searchParams.get("type") ?? "Model";
  if (!query) return Response.json({ results: [] });

  const results = await searchCatalog(query, assetType);
  return Response.json({ results });
}
