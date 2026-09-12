import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";

/**
 * Fixed identity for the "Continue as Dev User" login. Every dev-mode
 * sign-in resolves to the same shared account (matching prisma/seed.ts) so
 * local development always lands on a fully seeded, Pro-tier user instead
 * of a fresh all-zeros one.
 */
export const DEV_ROBLOX_ID = "mock-1";

/**
 * A password-less Credentials provider that only ever exists in
 * lib/auth/config.ts when `hasRobloxCredentials()` is false and
 * `NODE_ENV !== "production"` — see that file for the gating logic. It
 * bypasses the OAuth dance entirely and upserts the dev user directly,
 * since Credentials providers are never routed through the OAuth adapter
 * methods (createUser/linkAccount).
 */
export function DevMockProvider() {
  return Credentials({
    id: "dev-mock",
    name: "Dev Mode",
    credentials: {},
    async authorize() {
      const user = await prisma.user.upsert({
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
        },
      });
      return {
        id: user.id,
        robloxId: user.robloxId,
        robloxUsername: user.robloxUsername,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        name: user.displayName,
        email: null,
        image: user.avatarUrl,
      };
    },
  });
}
