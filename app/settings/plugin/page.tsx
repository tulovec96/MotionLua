import { PluginPairing } from "@/components/settings/plugin-pairing";

export default function PluginSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Studio plugin</h1>
        <p className="text-sm text-muted-foreground">
          Pair the RobloAI Studio plugin so tool calls run against your real place instead of demo fixtures.
        </p>
      </div>
      <PluginPairing />
    </div>
  );
}
