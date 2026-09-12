import { requireUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/settings");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <SettingsNav />
        {children}
      </main>
    </div>
  );
}
