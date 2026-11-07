import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createToken } from "@/lib/subscribers/token";

import { GET, POST } from "./route";

const applyToken = vi.fn();

vi.mock("@/lib/subscribers/service", () => ({
  applyToken: (payload: unknown) => applyToken(payload),
}));

const request = (token: string, method = "POST") =>
  new Request(`http://localhost/api/unsubscribe?token=${token}`, { method });

describe("/api/unsubscribe", () => {
  beforeEach(() => {
    applyToken.mockReset();
    vi.stubEnv("SUBSCRIBE_SECRET", "secret");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("unsubscribes on a one-click POST", async () => {
    const response = await POST(request(createToken("a@b.co", "unsubscribe")));

    expect(response.status).toBe(200);
    expect(applyToken).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.co", action: "unsubscribe" }));
  });

  it.each([["garbage"], ["a confirm token"]])("rejects %s", async (kind) => {
    const token = kind === "garbage" ? kind : createToken("a@b.co", "confirm");
    const response = await POST(request(token));

    expect(response.status).toBe(400);
    expect(applyToken).not.toHaveBeenCalled();
  });

  it("returns 500 when Directus fails", async () => {
    applyToken.mockRejectedValue(new Error("down"));

    const response = await POST(request(createToken("a@b.co", "unsubscribe")));

    expect(response.status).toBe(500);
  });

  it("sends a GET to the confirmation page without unsubscribing", async () => {
    const token = createToken("a@b.co", "unsubscribe");

    const response = GET(request(token, "GET"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`https://sbozh.me/subscribe?token=${token}`);
    expect(applyToken).not.toHaveBeenCalled();
  });

  it("sends a GET with a bad token to the plain page", () => {
    expect(GET(request("garbage", "GET")).headers.get("location")).toBe("https://sbozh.me/subscribe");
  });
});
