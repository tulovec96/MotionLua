"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/session";

export async function createChatSession(formData: FormData) {
  const user = await requireUser("/chat");
  const prompt = (formData.get("prompt") as string | null)?.trim() ?? "";

  const session = await prisma.chatSession.create({
    data: {
      userId: user.id,
      title: prompt ? prompt.slice(0, 60) : "New chat",
    },
  });

  const query = prompt ? `?prompt=${encodeURIComponent(prompt)}` : "";
  redirect(`/chat/${session.id}${query}`);
}
