import { requireUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/dashboard");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <DashboardNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
