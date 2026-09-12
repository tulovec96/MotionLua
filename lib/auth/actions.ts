"use server";

import { signIn, signOut } from "@/lib/auth/config";

export async function signInWithRoblox(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/chat";
  await signIn("roblox", { redirectTo: callbackUrl });
}

export async function signInWithDevMode(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/chat";
  await signIn("dev-mock", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
