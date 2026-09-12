import { getCurrentUser } from "@/lib/auth/session";
import { validateLuau } from "@/lib/luau/validate";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { source } = (await req.json()) as { source: string };
  if (typeof source !== "string") return new Response("Missing source", { status: 400 });

  return Response.json(validateLuau(source));
}
