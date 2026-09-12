import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { UserMenu } from "@/components/layout/user-menu";
import { RobloxSignInButton } from "@/components/layout/roblox-sign-in-button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
          <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <Sparkles className="size-3.5" />
          </span>
          RobloAI
        </Link>
        {user ? <UserMenu user={user} /> : <RobloxSignInButton size="sm" />}
      </div>
    </header>
  );
}
