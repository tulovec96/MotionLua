import { mockGetItemDetails, mockSearchCatalog, type CatalogItem } from "@/lib/marketplace/mock-catalog";

function isMockMode(): boolean {
  return process.env.MARKETPLACE_MODE === "mock";
}

// Roblox Catalog category IDs for the asset types this app's tools accept.
const CATEGORY_IDS: Record<string, number> = {
  Model: 10,
  Bundle: 19,
  Gear: 8,
};

interface RobloxCatalogResponseItem {
  id: number;
  name: string;
  creatorName?: string;
  itemType?: string;
  description?: string;
}

/**
 * Searches the public Roblox Catalog API. No API key required — this is a
 * genuinely public endpoint. Falls back to a local fixture set on any
 * network/parsing failure, or when MARKETPLACE_MODE=mock is set (useful
 * when outbound network access to Roblox isn't available in a given
 * environment).
 */
export async function searchCatalog(query: string, assetType = "Model"): Promise<CatalogItem[]> {
  if (isMockMode()) return mockSearchCatalog(query, assetType);

  try {
    const categoryId = CATEGORY_IDS[assetType] ?? CATEGORY_IDS.Model;
    const url = new URL("https://catalog.roblox.com/v1/search/items/details");
    url.searchParams.set("Category", String(categoryId));
    url.searchParams.set("Keyword", query);
    url.searchParams.set("Limit", "10");
    url.searchParams.set("SortType", "3"); // most relevant

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Catalog API returned ${res.status}`);
    const body = (await res.json()) as { data?: RobloxCatalogResponseItem[] };

    const items = (body.data ?? []).map(
      (item): CatalogItem => ({
        id: String(item.id),
        name: item.name,
        creator: item.creatorName ?? "Unknown creator",
        assetType: item.itemType ?? assetType,
      })
    );
    return items.length > 0 ? items : mockSearchCatalog(query, assetType);
  } catch (error) {
    console.warn("[marketplace] catalog search failed, using mock fixtures:", error);
    return mockSearchCatalog(query, assetType);
  }
}

export async function getCatalogItemDetails(assetId: string): Promise<CatalogItem> {
  if (isMockMode()) return mockGetItemDetails(assetId);

  try {
    const res = await fetch("https://catalog.roblox.com/v1/catalog/items/details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ itemType: "Asset", id: Number(assetId) }] }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Catalog API returned ${res.status}`);
    const body = (await res.json()) as { data?: RobloxCatalogResponseItem[] };
    const item = body.data?.[0];
    if (!item) throw new Error("Asset not found");

    return {
      id: String(item.id),
      name: item.name,
      creator: item.creatorName ?? "Unknown creator",
      assetType: item.itemType ?? "Model",
      description: item.description,
    };
  } catch (error) {
    console.warn("[marketplace] catalog details lookup failed, using mock fixture:", error);
    return mockGetItemDetails(assetId);
  }
}
