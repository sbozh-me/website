import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const runAnnouncements = vi.fn();
const afterCallbacks: (() => Promise<void>)[] = [];

vi.mock("@/lib/announcements/service", () => ({
  runAnnouncements: () => runAnnouncements(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => Promise<void>) => afterCallbacks.push(callback),
}));

function post(secret?: string) {
  return POST(
    new Request("http://localhost/api/announce", {
      method: "POST",
      headers: secret ? { "x-announce-secret": secret } : {},
    })
  );
}

describe("POST /api/announce", () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    runAnnouncements.mockReset();
    vi.stubEnv("ANNOUNCE_SECRET", "s3cret");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each([undefined, "wrong", "s3cret-but-longer"])("rejects secret %s", async (secret) => {
    const response = await post(secret);

    expect(response.status).toBe(401);
    expect(afterCallbacks).toHaveLength(0);
  });

  it("rejects everything when no secret is configured", async () => {
    vi.stubEnv("ANNOUNCE_SECRET", "");

    expect((await post("")).status).toBe(401);
  });

  it("accepts the flow call and sweeps after responding", async () => {
    runAnnouncements.mockResolvedValue([{ id: "p1", outcome: "sent" }]);

    const response = await post("s3cret");

    expect(response.status).toBe(202);
    expect(runAnnouncements).not.toHaveBeenCalled();
    await afterCallbacks[0]();
    expect(runAnnouncements).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalled();
  });

  it("stays quiet when nothing was due", async () => {
    runAnnouncements.mockResolvedValue([]);

    await post("s3cret");
    await afterCallbacks[0]();

    expect(console.log).not.toHaveBeenCalled();
  });

  it("logs a failed sweep instead of throwing", async () => {
    runAnnouncements.mockRejectedValue(new Error("directus down"));

    await post("s3cret");
    await afterCallbacks[0]();

    expect(console.error).toHaveBeenCalled();
  });
});
