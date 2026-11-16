import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getProject } from "./data";
import { getProjectVersions, getProjectsWithVersions, getProjectWithVersion } from "./versions";

const respond = (data: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({ ok, status, json: async () => ({ data }) });

describe("project versions from Directus", () => {
  beforeEach(() => {
    vi.stubEnv("DIRECTUS_URL", "http://directus.test");
    vi.stubEnv("DIRECTUS_TOKEN", "token");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads versions by slug, with the token, and drops a leading v", async () => {
    const fetchMock = respond([
      { slug: "tecraft", version: "v0.12.0" },
      { slug: "renesans-inter", version: " 0.2.0 " },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    expect(await getProjectVersions()).toEqual({ tecraft: "0.12.0", "renesans-inter": "0.2.0" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://directus.test/items/projects?fields=slug,version&limit=-1");
    expect(init.headers.Authorization).toBe("Bearer token");
    expect(init.next.revalidate).toBeGreaterThan(0);
  });

  it("skips empty versions, rows without a slug, and sbozh.me itself", async () => {
    vi.stubGlobal(
      "fetch",
      respond([
        { slug: "sbozh-me", version: "9.9.9" },
        { slug: "tecraft", version: null },
        { slug: "renesans-inter", version: "  " },
        { slug: null, version: "1.0.0" },
      ])
    );

    expect(await getProjectVersions()).toEqual({});
  });

  it("puts the Directus version on the project and keeps the code one otherwise", async () => {
    vi.stubGlobal("fetch", respond([{ slug: "tecraft", version: "0.12.0" }]));

    const projects = await getProjectsWithVersions();
    const bySlug = Object.fromEntries(projects.map((project) => [project.slug, project.version]));

    expect(bySlug.tecraft).toBe("0.12.0");
    expect(bySlug["renesans-inter"]).toBe(getProject("renesans-inter")!.version);
    expect(bySlug["sbozh-me"]).toBe(getProject("sbozh-me")!.version);
    // The shared project list is not written to
    expect(getProject("tecraft")!.version).not.toBe("0.12.0");
  });

  it("gives one project its Directus version", async () => {
    vi.stubGlobal("fetch", respond([{ slug: "tecraft", version: "0.12.0" }]));

    expect((await getProjectWithVersion("tecraft"))!.version).toBe("0.12.0");
    expect(await getProjectWithVersion("nope")).toBeUndefined();
  });

  it("never asks Directus for sbozh.me's version", async () => {
    const fetchMock = respond([{ slug: "sbozh-me", version: "9.9.9" }]);
    vi.stubGlobal("fetch", fetchMock);

    expect((await getProjectWithVersion("sbozh-me"))!.version).toBe(getProject("sbozh-me")!.version);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the code versions when Directus is not configured", async () => {
    vi.stubEnv("DIRECTUS_URL", "");
    const fetchMock = respond([]);
    vi.stubGlobal("fetch", fetchMock);

    expect(await getProjectVersions()).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to the code versions when Directus fails", async () => {
    vi.stubGlobal("fetch", respond(null, false, 503));
    expect(await getProjectVersions()).toEqual({});

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect((await getProjectWithVersion("tecraft"))!.version).toBe(getProject("tecraft")!.version);
  });
});
