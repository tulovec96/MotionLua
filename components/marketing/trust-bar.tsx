import { Reveal } from "@/components/marketing/animate-in";

const NAMES = ["Nova Studios", "Prism Games", "BlockForge", "Aetherial", "Rift Interactive", "Voxel Co."];

export function TrustBar() {
  return (
    <Reveal>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by creators building on Roblox
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-50 grayscale">
          {NAMES.map((name) => (
            <span key={name} className="font-heading text-lg font-medium">
              {name}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
