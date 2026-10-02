import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  PageTheme,
  READER_THEMES,
  READER_THEME_KEY,
  initReaderTheme,
  readerThemeScript,
  setReaderTheme,
} from "@sbozh/themes";

import { CyrillicHeadings, ReaderThemeToggle } from "../ReaderTheme";

const root = document.documentElement;

function visit(search: string) {
  window.history.replaceState(null, "", `/${search}`);
}

/** A fresh page load: the layout's data-theme, then the inline script. */
function load(search = "") {
  visit(search);
  root.setAttribute("data-theme", DEFAULT_THEME);
  delete root.dataset.readerTheme;
  initReaderTheme(READER_THEME_KEY, READER_THEMES, DEFAULT_THEME);
}

beforeEach(() => {
  window.localStorage.clear();
  load();
});

afterEach(() => {
  visit("");
});

describe("ReaderThemeToggle", () => {
  it("switches to Roman White and saves the choice", () => {
    render(<ReaderThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to the white reading theme" }));

    expect(root.getAttribute("data-theme")).toBe("roman-white");
    expect(window.localStorage.getItem(READER_THEME_KEY)).toBe("roman-white");
    expect(screen.getByRole("button", { name: "Switch to the dark theme" })).toHaveTextContent("Dark");
  });

  it("restores the saved choice on the next visit", () => {
    window.localStorage.setItem(READER_THEME_KEY, "roman-white");
    load();
    render(<ReaderThemeToggle />);

    expect(root.getAttribute("data-theme")).toBe("roman-white");
    expect(screen.getByRole("button", { name: "Switch to the dark theme" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switching back to dark clears the saved choice", () => {
    window.localStorage.setItem(READER_THEME_KEY, "roman-white");
    load();
    render(<ReaderThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Switch to the dark theme" }));

    expect(root.getAttribute("data-theme")).toBe(DEFAULT_THEME);
    expect(window.localStorage.getItem(READER_THEME_KEY)).toBeNull();
  });
});

describe("?theme= link", () => {
  it("sets and saves Roman White", () => {
    load("?theme=roman-white");

    expect(root.getAttribute("data-theme")).toBe("roman-white");
    expect(window.localStorage.getItem(READER_THEME_KEY)).toBe("roman-white");
  });

  it("?theme=obsidian-forge clears a saved choice", () => {
    window.localStorage.setItem(READER_THEME_KEY, "roman-white");
    load("?theme=obsidian-forge");

    expect(root.getAttribute("data-theme")).toBe(DEFAULT_THEME);
    expect(window.localStorage.getItem(READER_THEME_KEY)).toBeNull();
  });

  it("ignores unknown themes and keeps the saved choice", () => {
    window.localStorage.setItem(READER_THEME_KEY, "roman-white");
    load("?theme=kognitiv");

    expect(root.getAttribute("data-theme")).toBe("roman-white");
    expect(window.localStorage.getItem(READER_THEME_KEY)).toBe("roman-white");
  });

  it("the inline script is self-contained and does the same", () => {
    visit("?theme=roman-white");
    root.setAttribute("data-theme", DEFAULT_THEME);
    delete root.dataset.readerTheme;
    new Function(readerThemeScript)();

    expect(root.getAttribute("data-theme")).toBe("roman-white");
    expect(window.localStorage.getItem(READER_THEME_KEY)).toBe("roman-white");
  });
});

describe("reader choice beats PageTheme", () => {
  it("a post's theme applies when the reader hasn't picked one", () => {
    const { unmount } = render(<PageTheme theme="kognitiv" />);
    expect(root.getAttribute("data-theme")).toBe("kognitiv");

    unmount();
    expect(root.getAttribute("data-theme")).toBe(DEFAULT_THEME);
  });

  it("a saved choice wins over the post's theme and survives leaving the post", () => {
    window.localStorage.setItem(READER_THEME_KEY, "roman-white");
    load();
    const { unmount } = render(<PageTheme theme="kognitiv" />);
    expect(root.getAttribute("data-theme")).toBe("roman-white");

    unmount();
    expect(root.getAttribute("data-theme")).toBe("roman-white");
  });

  it("switching back to dark on a post brings the post's theme back", () => {
    window.localStorage.setItem(READER_THEME_KEY, "roman-white");
    load();
    render(<PageTheme theme="kognitiv" />);
    act(() => setReaderTheme(null));

    expect(root.getAttribute("data-theme")).toBe("kognitiv");
  });
});

describe("CyrillicHeadings", () => {
  it("marks h1/h2 with Cyrillic for the Cyrillic caps face, only in Roman White", () => {
    render(
      <>
        <CyrillicHeadings />
        <h1>Интервью с СЕО</h1>
        <h2>Cultural fit</h2>
      </>,
    );
    expect(screen.getByText("Интервью с СЕО")).not.toHaveAttribute("data-script");

    act(() => setReaderTheme("roman-white"));

    expect(screen.getByText("Интервью с СЕО")).toHaveAttribute("data-script", "cyrillic");
    expect(screen.getByText("Cultural fit")).not.toHaveAttribute("data-script");
  });
});
