import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Matches the fixed identity minted by lib/auth/dev-mock.ts's "Continue as
// Dev User" provider, so a fresh dev-mode login lands on a fully seeded
// account instead of an all-zeros one.
const DEV_ROBLOX_ID = "mock-1";

async function main() {
  await prisma.user.upsert({
    where: { robloxId: DEV_ROBLOX_ID },
    update: {},
    create: {
      robloxId: DEV_ROBLOX_ID,
      robloxUsername: "DevBuilder",
      displayName: "Dev Builder",
      avatarUrl: null,
      plan: "PRO",
      tokenBalance: 500_000,
      monthlyAllocation: 500_000,
      monthlyUsed: 0,
      rolloverTokens: 0,
    },
  });

  console.log(`Seeded dev user (robloxId=${DEV_ROBLOX_ID})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
