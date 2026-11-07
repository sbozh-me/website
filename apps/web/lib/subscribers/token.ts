import { createHmac, timingSafeEqual } from "node:crypto";

import { parseTopics, type Topic } from "./topics";

export type TokenAction = "confirm" | "unsubscribe";

export interface TokenPayload {
  email: string;
  action: TokenAction;
  /** Expiry in ms since epoch; unsubscribe links never expire */
  expires?: number;
  /** Confirm links carry the topics picked at signup; they apply only once confirmed */
  topics?: Topic[];
}

const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function getSecret(): string {
  const secret = process.env.SUBSCRIBE_SECRET;
  if (!secret) throw new Error("SUBSCRIBE_SECRET is not configured");
  return secret;
}

export function createToken(email: string, action: TokenAction, now = Date.now(), topics?: Topic[]): string {
  const payload: TokenPayload = {
    email,
    action,
    ...(action === "confirm" ? { expires: now + CONFIRM_TTL_MS } : {}),
    ...(action === "confirm" && topics ? { topics } : {}),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, getSecret())}`;
}

export function verifyToken(token: string, now = Date.now()): TokenPayload | null {
  const [data, signature, ...rest] = token.split(".");
  if (!data || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(data, getSecret()));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as TokenPayload;
  if (payload.expires !== undefined && payload.expires < now) return null;
  if (payload.topics !== undefined) payload.topics = parseTopics(payload.topics);
  return payload;
}
