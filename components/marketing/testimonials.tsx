import { Reveal, StaggerGroup, StaggerItem } from "@/components/marketing/animate-in";

const QUOTES = [
  {
    name: "Jax_Builds",
    role: "Solo developer",
    quote: "I described the mechanic in one sentence and got a working, server-authoritative script back with a diff I actually understood.",
  },
  {
    name: "MeridianStudio",
    role: "3-person team",
    quote: "The marketplace import flow alone saved us hours per week — no more digging through the catalog by hand.",
  },
  {
    name: "voxel_kate",
    role: "UI/UX for Roblox",
    quote: "Watching the trace stream while it edits GUIs feels like pair programming with someone who never gets tired.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="mb-4 text-center">
        <h2 className="font-heading text-3xl font-semibold sm:text-4xl">Early access, real feedback</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          RobloAI is in early access — these are quotes from our first cohort of testers.
        </p>
      </Reveal>

      <StaggerGroup className="grid gap-4 sm:grid-cols-3">
        {QUOTES.map((t) => (
          <StaggerItem key={t.name}>
            <figure className="flex h-full flex-col rounded-2xl border border-border/60 bg-card/60 p-6">
              <blockquote className="flex-1 text-sm text-foreground/90">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white">
                  {t.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="text-xs">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </section>
  );
}
