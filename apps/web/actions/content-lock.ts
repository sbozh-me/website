"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  UNLOCK_COOKIE,
  UNLOCK_MAX_AGE,
  isPasswordCorrect,
  unlockToken,
} from "@/lib/content-lock";

export interface UnlockState {
  error?: string;
}

/** Checks the content password and, when right, unlocks every locked post for 30 days */
export async function unlockContent(
  _prev: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  const password = String(formData.get("password") ?? "");
  if (!isPasswordCorrect(password)) {
    return { error: "Wrong password" };
  }

  const store = await cookies();
  store.set(UNLOCK_COOKIE, unlockToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE,
  });

  const path = String(formData.get("path") ?? "");
  if (path.startsWith("/")) revalidatePath(path);
  return {};
}
