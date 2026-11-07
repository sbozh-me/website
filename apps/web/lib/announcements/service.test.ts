import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyToken } from "@/lib/subscribers/token";

import { composeEmail, findDue, RETRY_AFTER_MS, runAnnouncements } from "./service";

const sendMail = vi.fn();

vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail, close: vi.fn() }) },
}));

vi.mock("@/lib/blog/title", () => ({
  hasTitleMarkup: (title: string) => title.includes("=="),
  plainTitle: async (title: string) => title.replaceAll("==", ""),
}));

const NOW = Date.parse("2026-11-07T12:00:00.000Z");

const post = {
  id: "p1",
  title: "==Hello==",
  slug: "hello",
  excerpt: "A post",
  date_published: "2026-11-07",
};

const release = {
  id: "r1",
  slug: "feeds",
  version: "v1.9.0",
  title: "Feeds",
  summary: "## New Features\n\n- RSS",
  date_released: "2026-11-07T09:00:00",
  project: { name: "sbozh.me", slug: "sbozh-me" },
};

interface State {
  posts: object[];
  releases: object[];
  subscribers: Record<string, string[]>;
  /** ids whose claim finds announced_at already set */
  taken?: string[];
}

const fetchMock = vi.fn();

function directus(state: State) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const path = decodeURIComponent(url.replace("http://directus", ""));
    let data: unknown = {};
    if (init?.method === "PATCH" && init.body) {
      const body = JSON.parse(String(init.body));
      const id = body.query?.filter?.id?._eq;
      data = id && state.taken?.includes(id) ? [] : [{ id }];
    } else if (path.startsWith("/items/posts")) {
      data = state.posts;
    } else if (path.startsWith("/items/release_notes")) {
      data = state.releases;
    } else if (path.startsWith("/items/subscribers")) {
      const topic = path.match(/filter\[topics\]\[_contains\]=(\w+)/)?.[1] ?? "";
      data = (state.subscribers[topic] ?? []).map((email) => ({ email }));
    }
    return { ok: true, json: async () => ({ data }) };
  });
}

function patches() {
  return fetchMock.mock.calls
    .filter(([, init]) => init?.method === "PATCH")
    .map(([url, init]) => ({ url, body: JSON.parse(init.body) }));
}

describe("announcements", () => {
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
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("findDue", () => {
    it("asks only for published, toggled, unannounced items whose date has come", async () => {
      directus({ posts: [], releases: [], subscribers: {} });

      await findDue();

      for (const [url] of fetchMock.mock.calls) {
        const query = decodeURIComponent(url);
        expect(query).toContain("filter[status][_eq]=published");
        expect(query).toContain("filter[notify_subscribers][_eq]=true");
        expect(query).toContain("filter[announced_at][_null]=true");
        expect(query).toMatch(/filter\[date_(published|released)\]\[_lte\]=\$NOW/);
      }
    });

    it("uses plain post titles and release names", async () => {
      directus({ posts: [post], releases: [release], subscribers: {} });

      const due = await findDue();

      expect(due.map((item) => [item.topic, item.subject])).toEqual([
        ["blog", "New post: Hello"],
        ["releases", "sbozh.me v1.9.0: Feeds"],
      ]);
    });
  });

  describe("composeEmail", () => {
    it("adds a working unsubscribe link and one-click headers", async () => {
      directus({ posts: [post], releases: [], subscribers: {} });
      const [item] = await findDue();

      const mail = composeEmail(item, "a@b.co");

      expect(mail.text).toContain("https://sbozh.me/blog/hello");
      expect(mail.text).toContain("subscribed to blog posts");
      expect(mail.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      const token = mail.headers["List-Unsubscribe"].match(/token=([^>]+)/)?.[1] ?? "";
      expect(verifyToken(token)).toMatchObject({ email: "a@b.co", action: "unsubscribe" });
    });
  });

  describe("runAnnouncements", () => {
    it("claims each item, then mails the subscribers of its topic", async () => {
      directus({
        posts: [post],
        releases: [release],
        subscribers: { blog: ["blog@x.co", "both@x.co"], releases: ["both@x.co"] },
      });

      const results = await runAnnouncements({ now: NOW, interval: 0 });

      expect(results.map((r) => [r.id, r.outcome, r.recipients])).toEqual([
        ["p1", "sent", 2],
        ["r1", "sent", 1],
      ]);
      expect(sendMail.mock.calls.map(([mail]) => [mail.to, mail.subject])).toEqual([
        ["blog@x.co", "New post: Hello"],
        ["both@x.co", "New post: Hello"],
        ["both@x.co", "sbozh.me v1.9.0: Feeds"],
      ]);
      expect(patches()[0].body).toEqual({
        query: { filter: { id: { _eq: "p1" }, announced_at: { _null: true } } },
        data: { announced_at: new Date(NOW).toISOString() },
      });
    });

    it("skips an item another sweep already claimed", async () => {
      directus({ posts: [post], releases: [], subscribers: { blog: ["a@b.co"] }, taken: ["p1"] });

      const [result] = await runAnnouncements({ now: NOW, interval: 0 });

      expect(result.outcome).toBe("taken");
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("marks old items announced without mailing anyone", async () => {
      directus({
        posts: [{ ...post, date_published: "2025-01-01" }],
        releases: [],
        subscribers: { blog: ["a@b.co"] },
      });

      const [result] = await runAnnouncements({ now: NOW, interval: 0 });

      expect(result.outcome).toBe("stale");
      expect(patches()).toHaveLength(1);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("counts a failed recipient without stopping the others", async () => {
      directus({ posts: [post], releases: [], subscribers: { blog: ["bad@x.co", "good@x.co"] } });
      sendMail.mockRejectedValueOnce(new Error("rejected"));

      const [result] = await runAnnouncements({ now: NOW, interval: 0 });

      expect(result).toMatchObject({ outcome: "sent", recipients: 2, failed: 1 });
      expect(sendMail).toHaveBeenCalledTimes(2);
    });

    it("releases the claim when nobody could be mailed, so the next sweep retries", async () => {
      // Own id: the cooldown is module state and would hide p1 from later tests
      directus({ posts: [{ ...post, id: "retry" }], releases: [], subscribers: { blog: ["a@b.co"] } });
      sendMail.mockRejectedValue(new Error("smtp down"));

      const [result] = await runAnnouncements({ now: NOW, interval: 0 });

      expect(result.outcome).toBe("failed");
      expect(patches().at(-1)).toEqual({ url: "http://directus/items/posts/retry", body: { announced_at: null } });

      // The release fires the on-save flow at once: that sweep must not retry yet
      sendMail.mockClear();
      await expect(runAnnouncements({ now: NOW + 1000, interval: 0 })).resolves.toEqual([]);
      expect(sendMail).not.toHaveBeenCalled();

      sendMail.mockResolvedValue(undefined);
      const [retry] = await runAnnouncements({ now: NOW + RETRY_AFTER_MS, interval: 0 });
      expect(retry.outcome).toBe("sent");
    });

    it("claims nothing when SMTP is not configured", async () => {
      vi.stubEnv("SMTP_HOST", "");
      directus({ posts: [post], releases: [], subscribers: { blog: ["a@b.co"] } });

      await expect(runAnnouncements({ now: NOW, interval: 0 })).rejects.toThrow("SMTP");
      expect(patches()).toEqual([]);
    });

    it("does nothing when nothing is due", async () => {
      directus({ posts: [], releases: [], subscribers: {} });

      await expect(runAnnouncements({ now: NOW })).resolves.toEqual([]);
    });

    it("runs overlapping sweeps one after another", async () => {
      directus({ posts: [post], releases: [], subscribers: { blog: ["a@b.co"] } });

      const [first, second] = await Promise.all([
        runAnnouncements({ now: NOW, interval: 0 }),
        runAnnouncements({ now: NOW, interval: 0 }),
      ]);

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(1);
      const order = fetchMock.mock.calls.map(([url, init]) => (init?.method === "PATCH" ? "claim" : url.split("?")[0]));
      // The second sweep starts reading only after the first finished claiming and sending
      expect(order.indexOf("claim")).toBeLessThan(order.lastIndexOf("http://directus/items/posts"));
    });
  });
});
