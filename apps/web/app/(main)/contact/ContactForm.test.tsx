import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContactForm } from "./ContactForm";

const mockFetch = vi.fn();

function fill() {
  fireEvent.change(screen.getByLabelText("Name (optional)"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there" } });
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts the fields with honeypot and start time", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await screen.findByText(/your message is on its way/);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/contact");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      email: "ada@example.com",
      message: "Hello there",
      name: "Ada",
      website: "",
    });
    expect(typeof body.startedAt).toBe("number");
  });

  it("keeps the message and shows an error when sending fails", async () => {
    mockFetch.mockResolvedValue(new Response("{}", { status: 502 }));
    render(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await screen.findByText(/message was not sent/);
    expect(screen.getByLabelText("Message")).toHaveValue("Hello there");
  });

  it("shows a rate-limit notice on 429", async () => {
    mockFetch.mockResolvedValue(new Response("{}", { status: 429 }));
    render(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await screen.findByText(/Too many messages/);
  });

  it("shows an error when the network throws", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByText(/message was not sent/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
});
