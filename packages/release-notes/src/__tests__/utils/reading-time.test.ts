import { describe, expect, it } from "vitest";

import { calculateReadingTime, formatReadingTime } from "../../utils";

const words = (count: number) => Array.from({ length: count }, () => "word").join(" ");

describe("calculateReadingTime", () => {
  it("is at least one minute", () => {
    expect(calculateReadingTime("")).toBe(1);
    expect(calculateReadingTime("Short note.")).toBe(1);
  });

  it("rounds up at 200 words a minute", () => {
    expect(calculateReadingTime(words(200))).toBe(1);
    expect(calculateReadingTime(words(201))).toBe(2);
  });

  it("takes a custom reading speed", () => {
    expect(calculateReadingTime(words(300), 100)).toBe(3);
  });

  it("does not count code blocks", () => {
    const code = "```ts\n" + words(500) + "\n```";
    expect(calculateReadingTime(`${words(100)}\n\n${code}`)).toBe(1);
  });

  it("counts link text but not the URL", () => {
    const text = `${words(199)} [here](https://example.com/a very long url)`;
    expect(calculateReadingTime(text)).toBe(1);
  });
});

describe("formatReadingTime", () => {
  it("labels minutes", () => {
    expect(formatReadingTime(5)).toBe("5 min read");
  });
});
