import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import Roblox from "@/lib/auth/roblox-provider";
import { DevMockProvider, DEV_ROBLOX_ID } from "@/lib/auth/dev-mock";
import { encrypt } from "@/lib/auth/encryption";

export function hasRobloxCredentials(): boolean {
  return Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);
}

/** True when the app is signing everyone in through the dev-mock provider. */
export const isDevAuthMode = !hasRobloxCredentials() && process.env.NODE_ENV !== "production";

// Wrap the Prisma adapter so OAuth refresh tokens are encrypted before they
// ever touch the database — linkAccount is the only place Auth.js writes the
// token pair coming back from a provider's /token exchange.
const baseAdapter = PrismaAdapter(prisma);
const adapter: Adapter = {
  ...baseAdapter,
  async linkAccount(account) {
    await baseAdapter.linkAccount!({
      ...account,
      refresh_token: account.refresh_token ? encrypt(account.refresh_token) : account.refresh_token,
    });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // JWT sessions (not database sessions) so the dev-mode Credentials
  // provider and the real Roblox OAuth provider can coexist — Auth.js only
  // supports database sessions for adapter-backed (OAuth/email) sign-ins,
  // never for Credentials. The Prisma adapter is still used for real OAuth
  // users, so Roblox identities remain fully persisted either way.
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    ...(hasRobloxCredentials()
      ? [
          Roblox({
            clientId: process.env.ROBLOX_CLIENT_ID!,
            clientSecret: process.env.ROBLOX_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(isDevAuthMode ? [DevMockProvider()] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.robloxId = user.robloxId;
        token.robloxUsername = user.robloxUsername;
        token.displayName = user.displayName;
        token.avatarUrl = user.avatarUrl;
        token.plan = user.plan;
        token.isDevMode = user.robloxId === DEV_ROBLOX_ID;
      }
      return token;
    },
    async session({ session, token }) {
      // Cast rather than rely on inference: combining a Prisma adapter with
      // `session: { strategy: "jwt" }` makes Auth.js's own callback param
      // type an intersection of its database- and jwt-session shapes, which
      // collapses field access down to `{}` for anything beyond the base
      // DefaultSession fields. The runtime shape is exactly what we put on
      // the token in the `jwt` callback above.
      const token_ = token as unknown as {
        uid?: string;
        robloxId?: string;
        robloxUsername?: string;
        displayName?: string | null;
        avatarUrl?: string | null;
        plan?: string;
        isDevMode?: boolean;
      };
      const user = session.user as unknown as {
        id: string;
        robloxId: string;
        robloxUsername: string;
        displayName: string | null;
        avatarUrl: string | null;
        plan: string;
        isDevMode: boolean;
      };
      user.id = token_.uid ?? user.id;
      user.robloxId = token_.robloxId ?? "";
      user.robloxUsername = token_.robloxUsername ?? "";
      user.displayName = token_.displayName ?? null;
      user.avatarUrl = token_.avatarUrl ?? null;
      user.plan = token_.plan ?? "FREE";
      user.isDevMode = token_.isDevMode ?? false;
      return session;
    },
  },
});
