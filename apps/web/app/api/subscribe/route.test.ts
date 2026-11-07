import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const requestSubscription = vi.fn();

vi.mock("@/lib/subscribers/service", () => ({
  requestSubscription: (email: string, topics: string[]) => requestSubscription(email, topics),
}));

let ipCounter = 0;

function post(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return POST(
    new Request("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "x-forwarded-for": `1.1.1.1, ${ip}` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    requestSubscription.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("normalizes the address and starts the subscription", async () => {
    const response = await post({ email: "  Me@Example.COM " });

    expect(response.status).toBe(200);
    expect(requestSubscription).toHaveBeenCalledWith("me@example.com", ["blog", "releases"]);
  });

  it("passes the picked topics, ignoring unknown ones", async () => {
    await post({ email: "me@example.com", topics: ["releases", "spam"] });

    expect(requestSubscription).toHaveBeenCalledWith("me@example.com", ["releases"]);
  });

  it("rejects an empty topic choice", async () => {
    const response = await post({ email: "me@example.com", topics: [] });

    expect(response.status).toBe(400);
    expect(requestSubscription).not.toHaveBeenCalled();
  });

  it.each(["", "nope", "a@b", "a b@c.co", `${"a".repeat(250)}@b.co`, 42])("rejects %s", async (email) => {
    const response = await post({ email });

    expect(response.status).toBe(400);
    expect(requestSubscription).not.toHaveBeenCalled();
  });

  it("rejects a body that isn't JSON", async () => {
    expect((await post("not json")).status).toBe(400);
  });

  it("silently drops honeypot submissions", async () => {
    const response = await post({ email: "bot@example.com", website: "http://spam" });

    expect(response.status).toBe(200);
    expect(requestSubscription).not.toHaveBeenCalled();
  });

  it("returns 500 when the subscription fails", async () => {
    requestSubscription.mockRejectedValue(new Error("smtp down"));

    expect((await post({ email: "a@b.co" })).status).toBe(500);
  });

  it("limits attempts per client, keyed on the proxy-appended address", async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await post({ email: "a@b.co" }, "9.9.9.9")).status);
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    expect((await post({ email: "a@b.co" }, "9.9.9.8")).status).toBe(200);
  });
});
