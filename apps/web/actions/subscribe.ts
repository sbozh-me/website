"use server";

import { redirect } from "next/navigation";

import { applyToken } from "@/lib/subscribers/service";
import { createToken, verifyToken } from "@/lib/subscribers/token";

/**
 * Runs from a button on /subscribe, never from the emailed GET link: mail scanners
 * open links, and they must not be able to confirm or unsubscribe anyone.
 */
export async function submitSubscriptionToken(formData: FormData) {
  const payload = verifyToken(String(formData.get("token") ?? ""));
  if (!payload) redirect("/subscribe");

  await applyToken(payload);

  if (payload.action === "confirm") {
    redirect(`/subscribe?status=confirmed&token=${createToken(payload.email, "unsubscribe")}`);
  }
  redirect("/subscribe?status=unsubscribed");
}
