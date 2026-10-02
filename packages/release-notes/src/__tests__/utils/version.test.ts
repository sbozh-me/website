import { describe, expect, it } from "vitest";

import { compareVersions, parseVersion, sortByVersion } from "../../utils";

describe("parseVersion", () => {
  it("splits a plain version", () => {
    expect(parseVersion("1.7.3")).toEqual([1, 7, 3]);
  });

  it("drops a v prefix in any case", () => {
    expect(parseVersion("v1.2.3")).toEqual([1, 2, 3]);
    expect(parseVersion("V2.0.0")).toEqual([2, 0, 0]);
  });

  it("turns a pre-release label into 0", () => {
    expect(parseVersion("1.3.0-beta")).toEqual([1, 3, 0, 0]);
  });
});

describe("compareVersions", () => {
  it("orders by major, minor, then patch", () => {
    expect(compareVersions("1.7.4", "1.7.3")).toBe(1);
    expect(compareVersions("1.7.3", "1.8.0")).toBe(-1);
    expect(compareVersions("2.0.0", "1.99.99")).toBe(1);
  });

  it("compares numerically, not as text", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
  });

  it("treats missing parts as 0", () => {
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("v1.2.0", "1.2.0")).toBe(0);
  });
});

describe("sortByVersion", () => {
  it("puts the newest first without changing the input", () => {
    const releases = [{ version: "1.2.0" }, { version: "1.10.0" }, { version: "1.9.1" }];
    expect(sortByVersion(releases).map((r) => r.version)).toEqual(["1.10.0", "1.9.1", "1.2.0"]);
    expect(releases[0].version).toBe("1.2.0");
  });
});
