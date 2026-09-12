import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

// Placeholder home page — replaced by the full Lemonade.gg-grade marketing
// site in a later phase. Exists for now so auth can be exercised end-to-end.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-heading text-4xl font-semibold">RobloAI</h1>
        <p className="max-w-md text-muted-foreground">
          Build Roblox games with AI. Marketing site coming soon — sign in to try the chat.
        </p>
        <Button
          size="lg"
          nativeButton={false}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
          render={<Link href="/signin">Get started</Link>}
        />
      </main>
    </div>
  );
}
