import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Authoritative auth guard for protected route groups. Auth.js middleware
 * would need to import this same Prisma-backed config at the edge, which
 * Prisma's Node driver adapter doesn't support — so protection lives in each
 * route group's layout (a Node.js server component) instead, per Auth.js's
 * own recommended pattern for adapter-backed apps.
 */
export async function requireUser(callbackPath?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const signInUrl = callbackPath
      ? `/signin?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "/signin";
    redirect(signInUrl);
  }
  return user;
}
