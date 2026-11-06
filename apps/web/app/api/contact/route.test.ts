import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const smtpConfig = vi.fn();
vi.mock("@/lib/mail", () => ({
  sendMail: (...args: unknown[]) => sendMail(...args),
  smtpConfig: () => smtpConfig(),
}));

import { resetRateLimit } from "@/lib/contact/rate-limit";

import { POST } from "./route";

function call(body: unknown, ip = "1.2.3.4") {
  return POST(
    new Request("http://localhost/api/contact", {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      method: "POST",
    }),
  );
}

const valid = () => ({
  email: "ada@example.com",
  message: "Hello there",
  name: "Ada",
  startedAt: Date.now() - 10_000,
  website: "",
});

describe("POST /api/contact", () => {
  beforeEach(() => {
    resetRateLimit();
    sendMail.mockReset().mockResolvedValue({ delivered: true });
    smtpConfig.mockReset().mockReturnValue({ host: "smtp" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends a notification and an acknowledgement", async () => {
    vi.stubEnv("CONTACT_INBOX", "inbox@sbozh.me");
    vi.stubEnv("CONTACT_FROM", "Sem <inbox@sbozh.me>");
    const response = await call(valid());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ delivered: true, ok: true });
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0]).toMatchObject({
      replyTo: "ada@example.com",
      to: "inbox@sbozh.me",
    });
    expect(sendMail.mock.calls[0][0].text).toContain("> Hello there");
    expect(sendMail.mock.calls[1][0]).toMatchObject({
      from: "Sem <inbox@sbozh.me>",
      replyTo: "inbox@sbozh.me",
      to: "ada@example.com",
    });
  });

  it("defaults the inbox to the site email and the ack sender to MAIL_FROM", async () => {
    await call(valid());
    expect(sendMail.mock.calls[0][0].to).toBe("sem.bozhyk@sbozh.me");
    expect(sendMail.mock.calls[1][0].from).toBeUndefined();
    expect(sendMail.mock.calls[1][0].replyTo).toBe("sem.bozhyk@sbozh.me");
  });

  it.each([
    ["bad email", { email: "nope" }],
    ["empty message", { message: "   " }],
    ["oversized message", { message: "x".repeat(5001) }],
  ])("rejects %s", async (_label, patch) => {
    const response = await call({ ...valid(), ...patch });
    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await call("{nope");
    expect(response.status).toBe(400);
  });

  it("silently drops a filled honeypot", async () => {
    const response = await call({ ...valid(), website: "http://spam" });
    expect(response.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("silently drops an instant submission", async () => {
    const response = await call({ ...valid(), startedAt: Date.now() });
    expect(response.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rate-limits per IP", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await call(valid())).status).toBe(200);
    }
    expect((await call(valid())).status).toBe(429);
    expect((await call(valid(), "5.6.7.8")).status).toBe(200);
  });

  it("returns 502 when SMTP is configured but the notification fails", async () => {
    sendMail.mockResolvedValueOnce({ delivered: false });
    const response = await call(valid());
    expect(response.status).toBe(502);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it("answers ok in dev mode with no SMTP", async () => {
    smtpConfig.mockReturnValue(null);
    sendMail.mockResolvedValue({ delivered: false });
    const response = await call(valid());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ delivered: false, ok: true });
  });

  it("strips newlines from the name", async () => {
    await call({ ...valid(), name: "Ada\r\nBcc: x@y.z" });
    expect(sendMail.mock.calls[0][0].subject).toBe("Nuntius: a letter from Ada Bcc: x@y.z");
  });
});
