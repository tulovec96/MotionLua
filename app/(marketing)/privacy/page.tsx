import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-6 text-sm text-muted-foreground">
        This is placeholder legal copy for the RobloAI scaffold. Replace with your actual privacy
        policy before launch. RobloAI authenticates users via Roblox OAuth and never receives or
        stores your Roblox password.
      </p>
    </div>
  );
}
