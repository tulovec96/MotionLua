"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { ChatUIMessage } from "@/lib/ai/trace";
import { MessageBubble } from "@/components/chat/message-bubble";

export function MessageList({ messages }: { messages: ChatUIMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
        <Sparkles className="size-6 text-violet-400" />
        <p className="text-sm">Describe what you want to build in Roblox Studio.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
