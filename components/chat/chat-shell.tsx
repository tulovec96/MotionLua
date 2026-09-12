"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ChatUIMessage } from "@/lib/ai/trace";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { TokenMeterBadge } from "@/components/chat/token-meter-badge";
import { Button } from "@/components/ui/button";

class QuotaExceededError extends Error {
  upgradeUrl: string;
  constructor(message: string, upgradeUrl: string) {
    super(message);
    this.name = "QuotaExceededError";
    this.upgradeUrl = upgradeUrl;
  }
}

export function ChatShell({
  sessionId,
  initialMessages,
  initialPrompt,
}: {
  sessionId: string;
  initialMessages: ChatUIMessage[];
  initialPrompt?: string;
}) {
  const [balance, setBalance] = useState<number | null>(null);
  const [quota, setQuota] = useState<{ message: string; upgradeUrl: string } | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
        body: { sessionId },
        fetch: async (input, init) => {
          const res = await fetch(input, init as RequestInit);
          if (res.status === 402) {
            const data = await res
              .clone()
              .json()
              .catch(() => null);
            throw new QuotaExceededError(
              data?.message ?? "You're out of tokens.",
              data?.upgradeUrl ?? "/pricing"
            );
          }
          return res;
        },
      }),
    [sessionId]
  );

  const { messages, sendMessage, status } = useChat<ChatUIMessage>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onData: (part) => {
      if (part.type === "data-tokenUsage") {
        setBalance(part.data.balance);
      }
    },
    onError: (error) => {
      setQuota(error instanceof QuotaExceededError ? { message: error.message, upgradeUrl: error.upgradeUrl } : null);
    },
  });

  const autoSent = useRef(false);
  useEffect(() => {
    if (!initialPrompt || autoSent.current) return;
    autoSent.current = true;
    setQuota(null);
    // Deferred one tick: React 18/19 dev Strict Mode mounts, cleans up, and
    // re-mounts every component once, and would otherwise abort a
    // sendMessage() fired synchronously from the (discarded) first mount's
    // effect. Resetting the ref in cleanup lets the real mount retry.
    const timer = setTimeout(() => {
      void sendMessage({ text: initialPrompt });
    }, 0);
    return () => {
      clearTimeout(timer);
      autoSent.current = false;
    };
  }, [initialPrompt, sendMessage]);

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-end border-b border-border/60 px-4 py-2">
        <TokenMeterBadge balance={balance} />
      </div>

      <MessageList messages={messages} />

      {quota ? (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">{quota.message}</span>
          <Button
            size="xs"
            variant="outline"
            nativeButton={false}
            className="border-amber-500/40 text-amber-300"
            render={<Link href={quota.upgradeUrl}>Upgrade</Link>}
          />
        </div>
      ) : null}

      <Composer
        onSubmit={(text) => {
          setQuota(null);
          void sendMessage({ text });
        }}
        disabled={busy}
      />
    </div>
  );
}
