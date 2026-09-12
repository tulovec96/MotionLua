import {
  Code2,
  FolderGit2,
  Package,
  PlayCircle,
  GitCompareArrows,
  Coins,
  Plug,
  Puzzle,
} from "lucide-react";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/marketing/animate-in";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Code2,
    title: "Script generation",
    description: "Production-quality, server-authoritative Luau from a single prompt.",
    span: "sm:col-span-2",
  },
  {
    icon: FolderGit2,
    title: "Multi-file editing",
    description: "Coordinated changes across ModuleScripts, RemoteEvents, and GUIs.",
  },
  {
    icon: Package,
    title: "Marketplace import",
    description: "Search and import models, sounds, animations, and meshes.",
  },
  {
    icon: PlayCircle,
    title: "Live playtest control",
    description: "Start, stop, and watch console output without leaving chat.",
  },
  {
    icon: GitCompareArrows,
    title: "Diff review",
    description: "Every edit shows a real unified diff before it lands.",
    span: "sm:col-span-2",
  },
  {
    icon: Coins,
    title: "Token-based pricing",
    description: "Pay for what you use, with live balance and usage history.",
  },
  {
    icon: Plug,
    title: "MCP compatible",
    description: "Bring your own MCP client — Claude Code, Cursor, and more.",
  },
  {
    icon: Puzzle,
    title: "Studio plugin",
    description: "A native DockWidget that pairs with the web app in seconds.",
  },
];

export function BentoFeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Everything you need to ship</h2>
        <p className="mt-3 text-muted-foreground">One chat interface, the whole Studio workflow.</p>
      </Reveal>

      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title} className={cn(f.span)}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 transition-colors hover:border-violet-500/40">
              <div
                aria-hidden
                className="absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 blur-2xl transition-opacity group-hover:opacity-80"
              />
              <span className="mb-4 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300">
                <f.icon className="size-4.5" />
              </span>
              <h3 className="font-heading text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
