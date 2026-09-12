import { Button } from "@/components/ui/button";
import { signInWithRoblox } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export function RobloxSignInButton({
  size = "default",
  className,
  callbackUrl,
}: {
  size?: "default" | "sm" | "lg";
  className?: string;
  callbackUrl?: string;
}) {
  return (
    <form action={signInWithRoblox}>
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <Button
        type="submit"
        size={size}
        className={cn(
          "gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90",
          className
        )}
      >
        <RobloxMark className="size-4" />
        Sign in with Roblox
      </Button>
    </form>
  );
}

function RobloxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4.24 3.4 18.3 6.87l-3.14 13.73L1.1 16.13 4.24 3.4Zm5.5 5.06-1.36 5.94 5.94 1.36 1.36-5.94-5.94-1.36Z" />
    </svg>
  );
}
