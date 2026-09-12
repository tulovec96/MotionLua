import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-6 text-sm text-muted-foreground">
        This is placeholder legal copy for the RobloAI scaffold. Replace with your actual terms
        before launch. RobloAI is an independent product and is not affiliated with, endorsed by,
        or sponsored by Roblox Corporation.
      </p>
    </div>
  );
}
