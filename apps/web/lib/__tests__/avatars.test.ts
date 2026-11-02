import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Avatar } from "@sbozh/blog/types";

const repoGetAvatars = vi.fn<() => Promise<Avatar[]>>();

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({ getAvatars: repoGetAvatars }),
}));

import { getAvatars, toAuthor } from "../avatars";

const sem: Avatar = {
  id: "a1",
  name: "Sem Bozhyk",
  slug: "sem-bozhyk",
  title: "Software Developer",
  description: "Building software",
  image: "/api/assets/sem",
  status: { text: "Open to work", color: "green" },
  cvUrl: "/forum/sem-bozhyk/cv",
  personas: [
    { id: "p1", name: "The Founder", slug: "founder", color: "#8b5cf6" },
    { id: "p2", name: "The Architect", slug: "architect", color: "#22c55e" },
  ],
};

describe("toAuthor", () => {
  it("maps an avatar to its home card", () => {
    expect(toAuthor(sem)).toEqual({
      id: "sem-bozhyk",
      name: "Sem Bozhyk",
      title: "Software Developer",
      description: "Building software",
      avatar: "/api/assets/sem",
      status: { text: "Open to work", variant: "green" },
      ctaButtons: [{ label: "View CV", href: "/forum/sem-bozhyk/cv", variant: "primary" }],
      blogAuthorSlugs: ["founder", "architect"],
    });
  });

  it("leaves out the CV button and status when the avatar has none", () => {
    const author = toAuthor({ ...sem, cvUrl: undefined, status: undefined, title: undefined });
    expect(author.ctaButtons).toEqual([]);
    expect(author.status).toBeUndefined();
    expect(author.title).toBe("");
  });

  it("keeps the easter-egg button on its avatar", () => {
    const author = toAuthor({ ...sem, slug: "oktvian-claude", cvUrl: undefined });
    expect(author.ctaButtons).toEqual([
      { label: "Who is that?", action: "under-construction", variant: "outline" },
    ]);
  });
});

describe("getAvatars", () => {
  beforeEach(() => {
    repoGetAvatars.mockReset();
  });

  it("returns the avatars from Directus", async () => {
    repoGetAvatars.mockResolvedValue([sem]);
    expect(await getAvatars()).toEqual([sem]);
  });

  it("returns none when Directus fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    repoGetAvatars.mockImplementation(async () => {
      throw new Error("down");
    });
    expect(await getAvatars()).toEqual([]);
  });
});
