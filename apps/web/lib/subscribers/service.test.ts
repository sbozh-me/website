import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyToken, getRecipients, requestSubscription } from "./service";
import { verifyToken } from "./token";

const sendMail = vi.fn();

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail, close: vi.fn() }) },
}));

const fetchMock = vi.fn();
const NOW = Date.parse("2026-10-30T12:00:00.000Z");

function respondWith(existing: object | null) {
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => ({
    ok: true,
    json: async () => ({ data: init?.method ? {} : existing ? [existing] : [] }),
  }));
}

function writes() {
  return fetchMock.mock.calls
    .filter(([, init]) => init?.method)
    .map(([url, init]) => ({ url, method: init.method, body: JSON.parse(init.body) }));
}

describe("subscribers service", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    sendMail.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("DIRECTUS_URL", "http://directus");
    vi.stubEnv("DIRECTUS_TOKEN", "token");
    vi.stubEnv("SUBSCRIBE_SECRET", "secret");
    vi.stubEnv("SMTP_HOST", "smtp.test");
    vi.stubEnv("SMTP_USER", "news@sbozh.me");
    vi.stubEnv("SMTP_PASSWORD", "password");
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("requestSubscription", () => {
    it("creates a pending subscriber and emails a confirmation link", async () => {
      respondWith(null);

      await requestSubscription("a@b.co", undefined, NOW);

      expect(writes()).toEqual([
        {
          url: "http://directus/items/subscribers",
          method: "POST",
          body: { email: "a@b.co", status: "pending", confirmation_sent_at: new Date(NOW).toISOString() },
        },
      ]);
      expect(sendMail.mock.calls[0][0].to).toBe("a@b.co");
      expect(sendMail.mock.calls[0][0].text).toContain("https://sbozh.me/subscribe?token=");
    });

    it("puts the picked topics into the confirmation link", async () => {
      respondWith(null);

      await requestSubscription("a@b.co", ["releases"], NOW);

      const token = sendMail.mock.calls[0][0].text.match(/token=(\S+)/)[1];
      expect(verifyToken(token, NOW)?.topics).toEqual(["releases"]);
      expect(sendMail.mock.calls[0][0].text).toContain("release notes");
    });

    it("asks a confirmed subscriber to confirm new topics without changing their status", async () => {
      respondWith({ id: 1, status: "confirmed", confirmation_sent_at: null });

      await requestSubscription("a@b.co", ["blog"], NOW);

      expect(writes()).toEqual([
        {
          url: "http://directus/items/subscribers/1",
          method: "PATCH",
          body: { confirmation_sent_at: new Date(NOW).toISOString() },
        },
      ]);
      expect(sendMail.mock.calls[0][0].subject).toContain("change");
    });

    it("does not re-email a confirmed address within the hour", async () => {
      respondWith({ id: 1, status: "confirmed", confirmation_sent_at: new Date(NOW - 1000).toISOString() });

      await requestSubscription("a@b.co", ["blog"], NOW);

      expect(writes()).toEqual([]);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("does not re-email a pending address within the hour", async () => {
      respondWith({ id: 1, status: "pending", confirmation_sent_at: new Date(NOW - 1000).toISOString() });

      await requestSubscription("a@b.co", undefined, NOW);

      expect(sendMail).not.toHaveBeenCalled();
    });

    it("re-emails a pending address after the hour", async () => {
      respondWith({ id: 1, status: "pending", confirmation_sent_at: new Date(NOW - 3600_000).toISOString() });

      await requestSubscription("a@b.co", undefined, NOW);

      expect(writes()[0].method).toBe("PATCH");
      expect(sendMail).toHaveBeenCalledOnce();
    });

    it("lets an unsubscribed address sign up again", async () => {
      respondWith({ id: 7, status: "unsubscribed", confirmation_sent_at: new Date(NOW - 1000).toISOString() });

      await requestSubscription("a@b.co", undefined, NOW);

      expect(writes()[0].url).toBe("http://directus/items/subscribers/7");
      expect(writes()[0].body.status).toBe("pending");
      expect(sendMail).toHaveBeenCalledOnce();
    });

    it("throws when Directus rejects the request", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 403 });

      await expect(requestSubscription("a@b.co", undefined, NOW)).rejects.toThrow("403");
    });

    it("logs the mail instead of failing when SMTP is not configured (local dev)", async () => {
      vi.stubEnv("SMTP_HOST", "");
      respondWith(null);

      await expect(requestSubscription("a@b.co", undefined, NOW)).resolves.toBeUndefined();
      expect(sendMail).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
    });

    it("throws when the confirmation can't be delivered", async () => {
      respondWith(null);
      sendMail.mockRejectedValueOnce(new Error("smtp down"));

      await expect(requestSubscription("a@b.co", undefined, NOW)).rejects.toThrow("not delivered");
    });
  });

  describe("applyToken", () => {
    it("confirms a subscriber", async () => {
      respondWith({ id: 1, status: "pending", confirmation_sent_at: null });

      await applyToken({ email: "a@b.co", action: "confirm" }, NOW);

      expect(writes()[0].body).toEqual({
        status: "confirmed",
        confirmed_at: new Date(NOW).toISOString(),
        unsubscribed_at: null,
      });
    });

    it("applies the topics carried by the confirm token", async () => {
      respondWith({ id: 1, status: "confirmed", confirmation_sent_at: null });

      await applyToken({ email: "a@b.co", action: "confirm", topics: ["releases"] }, NOW);

      expect(writes()[0].body.topics).toEqual(["releases"]);
    });

    it("unsubscribes a subscriber", async () => {
      respondWith({ id: 1, status: "confirmed", confirmation_sent_at: null });

      await applyToken({ email: "a@b.co", action: "unsubscribe" }, NOW);

      expect(writes()[0].body).toEqual({ status: "unsubscribed", unsubscribed_at: new Date(NOW).toISOString() });
    });

    it("ignores an address that no longer exists", async () => {
      respondWith(null);

      await applyToken({ email: "a@b.co", action: "confirm" }, NOW);

      expect(writes()).toEqual([]);
    });
  });

  describe("getRecipients", () => {
    it("asks Directus for confirmed subscribers of the topic", async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: [{ email: "a@b.co" }] }) });

      await expect(getRecipients("releases")).resolves.toEqual(["a@b.co"]);

      const url = decodeURIComponent(fetchMock.mock.calls[0][0]);
      expect(url).toContain("filter[status][_eq]=confirmed");
      expect(url).toContain("filter[topics][_contains]=releases");
    });
  });
});
