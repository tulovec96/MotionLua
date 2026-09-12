import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Account settings</h1>
        <p className="text-sm text-muted-foreground">
          Your Roblox identity and plan, as seen by RobloAI.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Roblox identity</CardTitle>
          <CardDescription>Synced from Roblox OAuth at sign-in.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Display name" value={user?.displayName ?? "—"} />
          <Field label="Username" value={`@${user?.robloxUsername ?? ""}`} />
          <Field label="Roblox ID" value={user?.robloxId ?? "—"} mono />
          <Field
            label="Plan"
            value={
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 uppercase text-[10px] tracking-wide">
                {user?.plan ?? "Free"}
              </Badge>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : "text-sm"}>{value}</span>
    </div>
  );
}
