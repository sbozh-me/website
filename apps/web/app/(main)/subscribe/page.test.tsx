import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createToken } from "@/lib/subscribers/token";

import SubscribePage from "./page";

vi.mock("@/actions/subscribe", () => ({ submitSubscriptionToken: vi.fn() }));

async function renderPage(params: { token?: string; status?: string }) {
  render(await SubscribePage({ searchParams: Promise.resolve(params) }));
}

describe("SubscribePage", () => {
  beforeEach(() => {
    vi.stubEnv("SUBSCRIBE_SECRET", "secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("asks to confirm the topics carried by the link", async () => {
    await renderPage({ token: createToken("a@b.co", "confirm", Date.now(), ["releases"]) });

    expect(screen.getByText("Send release notes from sbozh.me to a@b.co?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("falls back to news for links without topics", async () => {
    await renderPage({ token: createToken("a@b.co", "confirm") });

    expect(screen.getByText("Send news from sbozh.me to a@b.co?")).toBeInTheDocument();
  });

  it("asks before unsubscribing", async () => {
    await renderPage({ token: createToken("a@b.co", "unsubscribe") });

    expect(screen.getByRole("button", { name: "Unsubscribe" })).toBeInTheDocument();
  });

  it("offers to undo right after confirming", async () => {
    const token = createToken("a@b.co", "unsubscribe");
    await renderPage({ status: "confirmed", token });

    expect(screen.getByRole("heading", { name: "You're subscribed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Changed your mind? Unsubscribe" })).toHaveAttribute(
      "href",
      `/subscribe?token=${token}`
    );
  });

  it("confirms an unsubscribe", async () => {
    await renderPage({ status: "unsubscribed" });

    expect(screen.getByRole("heading", { name: "You're unsubscribed" })).toBeInTheDocument();
  });

  it("explains an invalid link without a button", async () => {
    await renderPage({ token: "garbage" });

    expect(screen.getByRole("heading", { name: "This link is no longer valid" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
