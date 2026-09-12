import { getCurrentUser } from "@/lib/auth/session";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav user={user} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
