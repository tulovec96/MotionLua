import { LogOut, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";

type SessionUser = {
  robloxUsername: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  plan?: string;
  isDevMode?: boolean;
};

export function UserMenu({ user }: { user: SessionUser }) {
  const initials = (user.displayName ?? user.robloxUsername).slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.robloxUsername} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{user.displayName ?? user.robloxUsername}</span>
            {user.isDevMode ? (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
                Dev Mode
              </Badge>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground font-normal">@{user.robloxUsername}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 text-[10px] uppercase tracking-wide">
            {user.plan ?? "Free"} plan
          </Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link href="/settings">
              <Settings className="size-4" />
              Settings
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            render={
              <button type="submit" className="w-full">
                <LogOut className="size-4" />
                Sign out
              </button>
            }
          />
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
