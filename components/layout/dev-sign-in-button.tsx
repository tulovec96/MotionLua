import { Button } from "@/components/ui/button";
import { signInWithDevMode } from "@/lib/auth/actions";

export function DevSignInButton({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <form action={signInWithDevMode}>
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <Button type="submit" variant="outline" size="lg" className="gap-2 w-full">
        Continue as Dev User
      </Button>
    </form>
  );
}
