import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownEditor } from "./MarkdownEditor";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MarkdownEditor label="Your text" onChange={setValue} value={value} />;
}

const editor = () => screen.getByLabelText("Your text") as HTMLTextAreaElement;

describe("MarkdownEditor", () => {
  it("numbers every line, the empty last one too", () => {
    render(<Harness initial={"one\ntwo\n"} />);
    expect(screen.getAllByTestId("editor-line").map((line) => line.textContent?.charAt(0))).toEqual(["1", "2", "3"]);
    expect(screen.getByText(/3 lines/)).toBeInTheDocument();

    fireEvent.change(editor(), { target: { value: "one" } });
    expect(screen.getAllByTestId("editor-line")).toHaveLength(1);
  });

  it("formats the selection from the toolbar and keeps it selected", () => {
    render(<Harness initial="say hello" />);
    editor().setSelectionRange(4, 9);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(editor().value).toBe("say **hello**");
    expect(editor().value.slice(editor().selectionStart, editor().selectionEnd)).toBe("hello");
  });

  it("has shortcuts, and shows where the caret is", () => {
    render(<Harness initial={"a\nword"} />);
    editor().setSelectionRange(2, 6);
    fireEvent.keyDown(editor(), { ctrlKey: true, key: "g" });

    expect(editor().value).toBe("a\n==word|meaning==");
    expect(screen.getByText(/Ln 2, Col 3/)).toBeInTheDocument();
  });

  it("offers the SDS and block tools", () => {
    render(<Harness />);
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    for (const name of ["Heading", "Quote", "List", "Link", "Voice block", /Glitch/]) {
      expect(toolbar).toContainElement(screen.getByRole("button", { name }));
    }
  });
});
