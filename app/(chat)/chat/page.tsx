import { Sparkles } from "lucide-react";
import { createChatSession } from "@/lib/chat/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NewChatPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <Sparkles className="size-5" />
        </span>
        <h1 className="font-heading text-2xl font-semibold">What are we building today?</h1>
        <p className="text-sm text-muted-foreground">
          Describe a script, GUI, or scene change — RobloAI will narrate every step.
        </p>
      </div>
      <form action={createChatSession} className="flex w-full max-w-xl items-end gap-2">
        <Textarea
          name="prompt"
          placeholder="Add a double-jump ability with a cooldown indicator…"
          rows={2}
          autoFocus
          className="min-h-16 flex-1 resize-none"
        />
        <Button type="submit" size="lg" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
          Start
        </Button>
      </form>
    </div>
  );
}
