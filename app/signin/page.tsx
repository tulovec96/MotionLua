import Link from "next/link";
import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RobloxSignInButton } from "@/components/layout/roblox-sign-in-button";
import { DevSignInButton } from "@/components/layout/dev-sign-in-button";
import { getCurrentUser } from "@/lib/auth/session";
import { isDevAuthMode } from "@/lib/auth/config";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const user = await getCurrentUser();
  const { callbackUrl } = await searchParams;
  if (user) {
    redirect(callbackUrl || "/chat");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent-violet)_0%,_transparent_60%)] opacity-20"
      />
      <Card className="relative w-full max-w-sm border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="items-center text-center">
          <Link href="/" className="mb-2 flex items-center gap-2 font-heading font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Sparkles className="size-4" />
            </span>
            RobloAI
          </Link>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to start building with AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <RobloxSignInButton size="lg" className="w-full" callbackUrl={callbackUrl} />
          {isDevAuthMode ? (
            <>
              <div className="flex items-center gap-3 py-1">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">no Roblox credentials set</span>
                <Separator className="flex-1" />
              </div>
              <DevSignInButton callbackUrl={callbackUrl} />
            </>
          ) : null}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            By continuing you agree to RobloAI&apos;s Terms and Privacy Policy. RobloAI is not
            affiliated with Roblox Corporation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
