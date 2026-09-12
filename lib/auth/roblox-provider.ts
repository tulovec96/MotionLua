import type { OAuth2Config, OAuthUserConfig } from "next-auth/providers";

/**
 * Shape of https://apis.roblox.com/oauth/v1/userinfo with `scope=openid profile`.
 * Roblox never returns an email address — `sub` (the numeric Roblox user id)
 * is the only stable identifier and is what we key `User.robloxId` on.
 */
export interface RobloxProfile {
  sub: string;
  preferred_username: string;
  name?: string;
  nickname?: string;
  picture?: string;
  profile?: string;
}

/**
 * Roblox OAuth 2.0 (the same flow Roblox uses for Open Cloud apps), configured
 * as a fully custom Auth.js OAuth provider since Roblox is not a built-in.
 * PKCE + state are both enforced (`checks`), matching Roblox's documented
 * authorization code + PKCE flow. Register the app and redirect URI at
 * https://create.roblox.com/dashboard/credentials.
 */
export default function Roblox(
  config: OAuthUserConfig<RobloxProfile>
): OAuth2Config<RobloxProfile> {
  return {
    id: "roblox",
    name: "Roblox",
    type: "oauth",
    authorization: {
      url: "https://apis.roblox.com/oauth/v1/authorize",
      params: { scope: "openid profile" },
    },
    token: "https://apis.roblox.com/oauth/v1/token",
    userinfo: "https://apis.roblox.com/oauth/v1/userinfo",
    // Roblox's token endpoint expects client_id/client_secret in the POST
    // body, not an HTTP Basic auth header.
    client: { token_endpoint_auth_method: "client_secret_post" },
    checks: ["pkce", "state"],
    profile(profile) {
      const displayName = profile.name ?? profile.nickname ?? profile.preferred_username;
      return {
        // A fresh random id for brand-new users; Auth.js/Prisma only uses
        // this on first-ever sign-in (`adapter.createUser`) — every
        // subsequent login resolves the existing user via the linked
        // Account row (provider + providerAccountId = sub), not this value.
        id: crypto.randomUUID(),
        robloxId: profile.sub,
        robloxUsername: profile.preferred_username,
        displayName,
        avatarUrl: profile.picture ?? null,
        name: displayName,
        email: null,
        image: profile.picture ?? null,
      };
    },
    style: { bg: "#000000", text: "#ffffff" },
    options: config,
  };
}
