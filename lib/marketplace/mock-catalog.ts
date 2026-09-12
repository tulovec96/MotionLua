export interface CatalogItem {
  id: string;
  name: string;
  creator: string;
  assetType: string;
  description?: string;
}

const MOCK_ITEMS: CatalogItem[] = [
  { id: "7011234561", name: "Medieval Castle Kit", creator: "StudioForge", assetType: "Model", description: "Modular castle pieces." },
  { id: "7011234562", name: "Low-Poly Forest Pack", creator: "VoxelWorks", assetType: "Model", description: "20 low-poly trees and rocks." },
  { id: "7011234563", name: "Sci-Fi Blaster Deluxe", creator: "PrismAssets", assetType: "Model", description: "A modular sci-fi blaster." },
  { id: "7011234564", name: "Starter Vehicle Bundle", creator: "GearHouse", assetType: "Bundle", description: "Three drivable vehicles." },
  { id: "7011234565", name: "Neon City Streetlamp", creator: "NightForge", assetType: "Model" },
  { id: "7011234566", name: "Anime Hair Pack Vol. 2", creator: "RigStudio", assetType: "Bundle" },
  { id: "7011234567", name: "Cartoon Explosion FX", creator: "FXLab", assetType: "Model" },
  { id: "7011234568", name: "Farmhouse Interior Kit", creator: "CozyBuilds", assetType: "Model" },
];

const MOCK_AUDIO = [
  { id: "9011234561", title: "Laser Blast 01", artist: "SFX Library", duration: 1.2 },
  { id: "9011234562", title: "Laser Blast 02", artist: "SFX Library", duration: 1.6 },
  { id: "9011234563", title: "8-bit Jump", artist: "RetroSounds", duration: 0.4 },
  { id: "9011234564", title: "Ambient Wind Loop", artist: "NatureFX", duration: 12.0 },
];

export function mockSearchCatalog(query: string, assetType?: string): CatalogItem[] {
  const q = query.toLowerCase();
  const filtered = MOCK_ITEMS.filter(
    (item) =>
      (!assetType || item.assetType.toLowerCase() === assetType.toLowerCase()) &&
      (item.name.toLowerCase().includes(q) || q.length === 0)
  );
  return (filtered.length > 0 ? filtered : MOCK_ITEMS).slice(0, 5);
}

export function mockGetItemDetails(assetId: string): CatalogItem {
  return (
    MOCK_ITEMS.find((i) => i.id === assetId) ?? {
      id: assetId,
      name: "Community Asset",
      creator: "CommunityCreator",
      assetType: "Model",
      description: "A community-made asset.",
    }
  );
}

export function mockSearchAudio(query: string) {
  const q = query.toLowerCase();
  const filtered = MOCK_AUDIO.filter((a) => a.title.toLowerCase().includes(q) || q.length === 0);
  return (filtered.length > 0 ? filtered : MOCK_AUDIO).slice(0, 4);
}
