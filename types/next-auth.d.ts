import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    robloxId: string;
    robloxUsername: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    plan?: string;
  }

  interface Session {
    user: {
      id: string;
      robloxId: string;
      robloxUsername: string;
      displayName?: string | null;
      avatarUrl?: string | null;
      plan?: string;
      isDevMode?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    robloxId?: string;
    robloxUsername?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    plan?: string;
    isDevMode?: boolean;
  }
}
