import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toolRegistry } from "@/lib/ai/tool-registry";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { hasAnthropicKey, resolveModel, thinkingProviderOptions } from "@/lib/ai/provider";
import { runMockTrace } from "@/lib/ai/mock-model";
import type { ChatUIMessage } from "@/lib/ai/trace";
import type { PlanId } from "@/lib/tokens/pricing";
import { estimateReserve, reserveTokens, releaseReservation, InsufficientTokensError } from "@/lib/tokens/reserve";
import { reconcileUsage, computeUnits, type UsageCounts } from "@/lib/tokens/reconcile";
import { requestContext } from "@/lib/ai/request-context";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, sessionId }: { messages: ChatUIMessage[]; sessionId: string } = await req.json();

  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId: user.id } });
  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await prisma.chatMessage.create({
      data: { sessionId, role: "USER", content: lastMessage as unknown as object },
    });
  }

  const reservedUnits = estimateReserve();
  try {
    await reserveTokens(user.id, reservedUnits);
  } catch (error) {
    if (error instanceof InsufficientTokensError) {
      return Response.json(
        {
          error: "insufficient_tokens",
          message: "You're out of tokens for this cycle. Upgrade your plan or buy a token pack to keep chatting.",
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      );
    }
    throw error;
  }

  const planId = (user.plan as PlanId) ?? "FREE";
  let modelLabel = "mock-model";
  let reservationSettled = false;

  const stream = createUIMessageStream<ChatUIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => requestContext.run({ userId: user.id }, async () => {
      let usage: UsageCounts;

      if (hasAnthropicKey()) {
        const model = resolveModel(planId);
        modelLabel = model.modelId;
        const result = streamText({
          model,
          system: buildSystemPrompt(),
          messages: await convertToModelMessages(messages),
          tools: toolRegistry,
          providerOptions: thinkingProviderOptions(planId),
        });
        writer.merge(result.toUIMessageStream({ sendReasoning: true }));

        const finalUsage = await result.totalUsage;
        const toolCalls = await result.toolCalls;
        const reasoningTokens = finalUsage.outputTokenDetails?.reasoningTokens ?? 0;
        usage = {
          inputTokens: finalUsage.inputTokens ?? 0,
          outputTokens: Math.max((finalUsage.outputTokens ?? 0) - reasoningTokens, 0),
          reasoningTokens,
          toolCalls: toolCalls.length,
        };
      } else {
        const userText = lastMessage?.parts?.find((p) => p.type === "text")?.text ?? "";
        usage = await runMockTrace(writer, userText);
      }

      const balance = await reconcileUsage({
        userId: user.id,
        sessionId,
        model: modelLabel,
        reservedUnits,
        usage,
      });
      reservationSettled = true;

      writer.write({
        type: "data-tokenUsage",
        data: { balance, reserved: reservedUnits, used: computeUnits(usage), model: modelLabel },
      });
    }),
    onError: (error) => {
      console.error("[chat] stream error", error);
      return "Something went wrong while generating a response.";
    },
    onEnd: async ({ messages: finalMessages }) => {
      if (!reservationSettled) {
        await releaseReservation(user.id, reservedUnits);
      }
      const last = finalMessages[finalMessages.length - 1];
      if (last?.role === "assistant") {
        await prisma.chatMessage.create({
          data: { sessionId, role: "ASSISTANT", content: last as unknown as object },
        });
        await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
