import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
vi.mock("@/lib/mail", () => ({ sendMail: (...args: unknown[]) => sendMail(...args) }));

const directusRest = vi.fn();
vi.mock("@/lib/directus/rest", () => ({ directusRest: (...args: unknown[]) => directusRest(...args) }));

import { resetSubmitRateLimit } from "@/lib/blog/submissions";

import { POST } from "./route";

function call(body: unknown, ip = "1.2.3.4") {
  return POST(
    new Request("http://localhost/api/blog/submit", {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      method: "POST",
    }),
  );
}

const valid = () => ({
  content: "On the page it's a story. Only in my head it's a ==city|teal:basement==.",
  contact: "@chair26b",
  penName: "Chair 26B",
  startedAt: Date.now() - 60_000,
  title: "The Binary Answer",
  website: "",
});

describe("POST /api/blog/submit", () => {
  beforeEach(() => {
    resetSubmitRateLimit();
    sendMail.mockReset().mockResolvedValue({ delivered: true });
    directusRest.mockReset().mockResolvedValue({ data: { id: 7 } });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("stores the text as a new submission and notifies the inbox", async () => {
    vi.stubEnv("CONTACT_INBOX", "inbox@sbozh.me");
    const response = await call(valid());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const [path, init] = directusRest.mock.calls[0];
    expect(path).toBe("/items/blog_submissions");
    expect(JSON.parse(init.body)).toEqual({
      contact: "@chair26b",
      content: valid().content,
      status: "new",
      title: "The Binary Answer",
    });
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: "inbox@sbozh.me" });
    expect(sendMail.mock.calls[0][0].text).toContain("/admin/content/blog_submissions/7");
    expect(sendMail.mock.calls[0][0].text).toContain("Contact: @chair26b");
  });

  it("never stores who sent it", async () => {
    await call(valid(), "9.9.9.9");
    const stored = directusRest.mock.calls[0][1].body as string;
    expect(stored).not.toContain("9.9.9.9");
    expect(Object.keys(JSON.parse(stored)).sort()).toEqual(["contact", "content", "status", "title"]);
  });

  it("stores empty title and contact as null, and ignores a pen name", async () => {
    await call({ ...valid(), contact: "  ", title: "" });
    const stored = JSON.parse(directusRest.mock.calls[0][1].body);
    expect(stored).toMatchObject({ contact: null, title: null });
    expect(stored).not.toHaveProperty("pen_name");
  });

  it("rejects text that is too short, too long or missing", async () => {
    expect((await call({ ...valid(), content: "short" })).status).toBe(400);
    expect((await call({ ...valid(), content: "x".repeat(20_001) })).status).toBe(400);
    expect((await call({ ...valid(), content: undefined })).status).toBe(400);
    expect((await call("not json")).status).toBe(400);
    expect(directusRest).not.toHaveBeenCalled();
  });

  it("pretends to accept bots and stores nothing", async () => {
    expect((await call({ ...valid(), website: "spam.example" })).status).toBe(200);
    expect((await call({ ...valid(), startedAt: Date.now() })).status).toBe(200);
    expect(directusRest).not.toHaveBeenCalled();
  });

  it("limits each address to three texts an hour", async () => {
    for (let i = 0; i < 3; i++) expect((await call(valid())).status).toBe(200);
    expect((await call(valid())).status).toBe(429);
    expect((await call(valid(), "5.6.7.8")).status).toBe(200);
  });

  it("answers 502 when Directus fails", async () => {
    directusRest.mockRejectedValue(new Error("down"));
    const response = await call(valid());
    expect(response.status).toBe(502);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("still succeeds when the notification fails", async () => {
    sendMail.mockRejectedValue(new Error("smtp down"));
    expect((await call(valid())).status).toBe(200);
  });
});
