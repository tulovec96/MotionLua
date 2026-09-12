import { Sparkles, User } from "lucide-react";
import type { ChatUIMessage } from "@/lib/ai/trace";
import { ThinkingBlock } from "@/components/chat/thinking-block";
import { StepCard } from "@/components/chat/step-card";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: ChatUIMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-secondary text-secondary-foreground" : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
      </span>
      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return part.text ? (
                <p
                  key={i}
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                    isUser ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground/90"
                  )}
                >
                  {part.text}
                </p>
              ) : null;
            case "reasoning":
              return <ThinkingBlock key={i} part={part} />;
            default:
              if (part.type.startsWith("tool-")) {
                return <StepCard key={i} part={part as Extract<typeof part, { type: `tool-${string}` }>} />;
              }
              return null;
          }
        })}
      </div>
    </div>
  );
}
