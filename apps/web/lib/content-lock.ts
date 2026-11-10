import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Locked (paid) content behind one static password, until real accounts exist.
 *
 * The cookie never holds the password: it holds an HMAC keyed by the password, so
 * changing CONTENT_PASSWORD signs everyone out of locked posts at once.
 */

export const UNLOCK_COOKIE = "sbozh_unlock";
export const UNLOCK_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const DEFAULT_PASSWORD = "sakeoflover26!";

export function contentPassword(): string {
  return process.env.CONTENT_PASSWORD || DEFAULT_PASSWORD;
}

export function unlockToken(password: string = contentPassword()): string {
  return createHmac("sha256", password).update("content-unlock:v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isPasswordCorrect(input: string): boolean {
  return safeEqual(input, contentPassword());
}

export function isUnlockTokenValid(token: string | undefined): boolean {
  return !!token && safeEqual(token, unlockToken());
}
