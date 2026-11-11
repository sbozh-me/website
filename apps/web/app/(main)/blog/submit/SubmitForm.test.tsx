import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SubmitForm } from "./SubmitForm";

const mockFetch = vi.fn();
const TEXT = "On the page it's a story. ==city|teal:basement==";

const respond = (status: number) =>
  mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: status === 200 }), { status }));

function fill(content = TEXT) {
  fireEvent.change(screen.getByLabelText("Title (optional)"), { target: { value: "Binary" } });
  fireEvent.change(screen.getByLabelText("Your text"), { target: { value: content } });
  fireEvent.click(screen.getByRole("switch", { name: "I understand the rules" }));
}

const submit = () => screen.getByRole("button", { name: "Submit anonymously" });

describe("SubmitForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    window.localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("stays disabled until the text is long enough and the rules are accepted", () => {
    render(<SubmitForm />);
    expect(submit()).toBeDisabled();
    fill("too short");
    expect(submit()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Your text"), { target: { value: TEXT } });
    expect(submit()).toBeEnabled();
  });

  it("posts the text without any identity and thanks the writer", async () => {
    respond(200);
    render(<SubmitForm />);
    fill();
    fireEvent.click(submit());

    await screen.findByText("Sent. Thank you.");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/blog/submit");
    expect(JSON.parse(init.body)).toMatchObject({ contact: "", content: TEXT, title: "Binary", website: "" });
    expect(window.localStorage.getItem("blog-submit-draft")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Write another" }));
    expect(screen.getByLabelText("Your text")).toHaveValue("");
  });

  it("keeps the draft in this browser across reloads", async () => {
    const { unmount } = render(<SubmitForm />);
    fill();
    await waitFor(() => expect(window.localStorage.getItem("blog-submit-draft")).toContain("basement"));
    unmount();

    render(<SubmitForm />);
    await waitFor(() => expect(screen.getByLabelText("Your text")).toHaveValue(TEXT));
  });

  it.each([
    [429, /come back in an hour/],
    [400, /too short or too long/],
    [502, /nothing was sent/],
  ])("explains a %i and keeps the text", async (status, message) => {
    respond(status);
    render(<SubmitForm />);
    fill();
    fireEvent.click(submit());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText("Your text")).toHaveValue(TEXT);
  });
});

describe("SubmitForm preview", () => {
  beforeEach(() => window.localStorage.clear());

  it("switches to a rendered preview and back without losing the text", async () => {
    render(<SubmitForm />);
    fireEvent.change(screen.getByLabelText("Title (optional)"), { target: { value: "Binary" } });
    fireEvent.change(screen.getByLabelText("Your text"), {
      target: { value: 'Me, ==the Princeps|gold:Semen==.\n\n<Voice color="teal">\n\n— Ave.\n\n</Voice>' },
    });

    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    // The compiler loads on first preview: slow under a parallel test run
    const preview = await screen.findByRole("region", { name: "Preview" }, { timeout: 5000 });
    await waitFor(() => expect(preview.querySelector('[data-voice="teal"]')).not.toBeNull(), { timeout: 5000 });
    expect(preview).toHaveTextContent("Binary");
    expect(preview).toHaveTextContent("The Anon");
    expect(preview).toHaveTextContent("1 min read");
    // The writer never sets the hero image
    expect(screen.getByRole("figure", { name: "Hero image" })).toHaveTextContent(/The Senate picks it/);

    fireEvent.click(screen.getByRole("tab", { name: "Write" }));
    expect((screen.getByLabelText("Your text") as HTMLTextAreaElement).value).toContain("the Princeps");
  });

  it("shows a parse error in the preview", async () => {
    render(<SubmitForm />);
    fireEvent.change(screen.getByLabelText("Your text"), { target: { value: "a text with a stray { brace" } });
    fireEvent.click(screen.getByRole("tab", { name: "Preview" }));
    expect(await screen.findByRole("alert", {}, { timeout: 5000 })).toHaveTextContent(/Line 1:/);
  });
});
