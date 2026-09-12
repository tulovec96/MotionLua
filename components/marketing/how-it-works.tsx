import { Download, LogIn, MessageSquare, Rocket } from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/marketing/animate-in";

const STEPS = [
  { icon: Download, title: "Install the plugin", description: "One click from the Roblox Studio plugin marketplace." },
  { icon: LogIn, title: "Sign in with Roblox", description: "OAuth with your real Roblox account — no new password." },
  { icon: MessageSquare, title: "Start chatting", description: "Describe what you want to build, in plain language." },
  { icon: Rocket, title: "Ship your game", description: "Review the diff, playtest, and publish with confidence." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <Reveal className="mb-14 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">How it works</h2>
      </Reveal>

      <StaggerGroup className="relative grid gap-8 sm:grid-cols-4">
        <div
          aria-hidden
          className="absolute top-5 left-0 hidden h-px w-full bg-gradient-to-r from-transparent via-border to-transparent sm:block"
        />
        {STEPS.map((step, i) => (
          <StaggerItem key={step.title} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 mb-4 flex size-10 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
              {i + 1}
            </span>
            <step.icon className="mb-2 size-5 text-violet-400" />
            <h3 className="font-heading text-sm font-semibold">{step.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
