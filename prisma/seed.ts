import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Matches the fixed identity minted by lib/auth/dev-mock.ts's "Continue as
// Dev User" provider, so a fresh dev-mode login lands on a fully seeded
// account instead of an all-zeros one.
const DEV_ROBLOX_ID = "mock-1";

async function main() {
  const user = await prisma.user.upsert({
    where: { robloxId: DEV_ROBLOX_ID },
    update: {},
    create: {
      robloxId: DEV_ROBLOX_ID,
      robloxUsername: "DevBuilder",
      displayName: "Dev Builder",
      avatarUrl: null,
      plan: "PRO",
      tokenBalance: 500_000,
      monthlyAllocation: 500_000,
      monthlyUsed: 0,
      rolloverTokens: 0,
    },
  });

  // A sample chat session so /chat shows history on a fresh clone, instead
  // of every reviewer having to send a first message before seeing what a
  // finished trace looks like.
  const existingSession = await prisma.chatSession.findFirst({ where: { userId: user.id } });
  if (!existingSession) {
    const session = await prisma.chatSession.create({
      data: { userId: user.id, title: "Add a double-jump ability" },
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "USER",
        content: {
          id: "seed-user-1",
          role: "user",
          parts: [{ type: "text", text: "Add a double-jump ability with a cooldown indicator" }],
        },
      },
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: {
          id: "seed-assistant-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Let me check what's in PlayerController.luau." },
            {
              type: "tool-read_script",
              toolCallId: "seed-call-1",
              state: "output-available",
              input: { path: "ServerScriptService/PlayerController" },
              output: {
                path: "ServerScriptService/PlayerController",
                content: '--!strict\nlocal PlayerController = {}\n\nreturn PlayerController\n',
                lines: 4,
              },
            },
            { type: "text", text: 'I\'ll add that now: "double-jump ability with a cooldown indicator".' },
            {
              type: "tool-write_script",
              toolCallId: "seed-call-2",
              state: "output-available",
              input: {
                path: "ServerScriptService/PlayerController",
                content:
                  '--!strict\nlocal PlayerController = {}\n\nlocal JUMP_COOLDOWN = 1.5\nlocal lastJumpAt = 0\n\nreturn PlayerController\n',
                summary: "Added jump cooldown state",
              },
              output: {
                path: "ServerScriptService/PlayerController",
                before: '--!strict\nlocal PlayerController = {}\n\nreturn PlayerController\n',
                after:
                  '--!strict\nlocal PlayerController = {}\n\nlocal JUMP_COOLDOWN = 1.5\nlocal lastJumpAt = 0\n\nreturn PlayerController\n',
                summary: "Added jump cooldown state",
              },
            },
            { type: "text", text: "Done — the cooldown state is in place and ready to wire up to input." },
          ],
        },
      },
    });

    // Usage events spread across the last two weeks so the dashboard's
    // daily-consumption chart has something to show immediately.
    const usageDays = [13, 11, 8, 6, 5, 3, 1, 0];
    for (const daysAgo of usageDays) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      const inputTokens = 300 + Math.floor(Math.random() * 400);
      const outputTokens = 150 + Math.floor(Math.random() * 300);
      const reasoningTokens = Math.floor(Math.random() * 80);
      const toolCalls = 1 + Math.floor(Math.random() * 3);
      const totalUnits = inputTokens + outputTokens * 2 + reasoningTokens * 3 + toolCalls * 500;

      await prisma.usageEvent.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          model: "claude-sonnet-5",
          inputTokens,
          outputTokens,
          reasoningTokens,
          toolCalls,
          totalUnits,
          createdAt,
        },
      });
    }

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "SUBSCRIPTION",
        amountCents: 2000,
        tokensGranted: 500_000,
        status: "COMPLETED",
      },
    });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "TOKEN_PACK",
        amountCents: 2000,
        tokensGranted: 275_000,
        status: "COMPLETED",
      },
    });
  }

  console.log(`Seeded dev user (robloxId=${DEV_ROBLOX_ID}) with a sample chat session and usage history`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
