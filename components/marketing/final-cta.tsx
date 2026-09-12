import Link from "next/link";
import { Reveal } from "@/components/marketing/animate-in";
import { GradientMeshBg } from "@/components/marketing/gradient-mesh-bg";
import { RobloxSignInButton } from "@/components/layout/roblox-sign-in-button";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden px-4 py-28 text-center sm:px-6">
      <GradientMeshBg />
      <Reveal>
        <h2 className="font-heading text-3xl font-semibold sm:text-5xl">Ready to build faster?</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Sign in with Roblox and start chatting with RobloAI in under a minute.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <RobloxSignInButton size="lg" className="px-6" />
          <Link href="#faq" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Read the docs
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
