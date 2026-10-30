import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Avatar } from "@sbozh/blog/types";

const getAvatars = vi.fn<() => Promise<Avatar[]>>();

vi.mock("@/lib/blog/repository", () => ({
  createBlogRepository: () => ({ getAvatars }),
}));

import ForumPage from "./page";

const avatars: Avatar[] = [
  {
    id: "a1",
    name: "Sem Bozhyk",
    slug: "sem-bozhyk",
    title: "Software Developer",
    image: "/api/assets/sem",
    cvUrl: "/forum/sem-bozhyk/cv",
    personas: [
      { id: "p1", name: "The Founder", slug: "founder", color: "#8b5cf6" },
      { id: "p2", name: "The Architect", slug: "architect", color: "#22c55e" },
    ],
  },
  {
    id: "a2",
    name: "Semen Bozhyk",
    slug: "semen-bozhyk",
    personas: [
      {
        id: "p3",
        name: "Pan Dude",
        slug: "pan-dude",
        color: "#f59e0b",
        description: "A text stand-up comedian",
      },
    ],
  },
];

async function renderPage() {
  render(await ForumPage());
}

describe("ForumPage", () => {
  beforeEach(() => {
    getAvatars.mockReset();
    getAvatars.mockResolvedValue(avatars);
  });

  it("explains avatars and personas", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Forum");
    expect(screen.getByRole("heading", { name: "Avatars" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Personas" })).toBeInTheDocument();
  });

  it("lists every avatar with its linked personas", async () => {
    await renderPage();
    expect(screen.getByRole("list", { name: "Sem Bozhyk personas" })).toHaveTextContent(
      "The FounderThe Architect",
    );
    expect(screen.getByRole("list", { name: "Semen Bozhyk personas" })).toHaveTextContent(
      "Pan DudeA text stand-up comedian",
    );
  });

  it("colors each persona badge with its own color", async () => {
    await renderPage();
    expect(screen.getByText("The Founder")).toHaveStyle({
      color: "#8b5cf6",
      borderColor: "#8b5cf6",
      backgroundColor: "#8b5cf61a",
    });
  });

  it("shows an avatar's image only when Directus has one", async () => {
    await renderPage();
    expect(screen.getByRole("img", { name: "Sem Bozhyk" }).getAttribute("src")).toContain(
      "%2Fapi%2Fassets%2Fsem",
    );
    expect(screen.queryByRole("img", { name: "Semen Bozhyk" })).not.toBeInTheDocument();
  });

  it("links a CV only where one exists", async () => {
    await renderPage();
    expect(screen.getByRole("link", { name: "Sem Bozhyk's CV" })).toHaveAttribute(
      "href",
      "/forum/sem-bozhyk/cv",
    );
    expect(screen.getAllByText("CV is being crafted.")).toHaveLength(1);
  });

  it("keeps the explanation when Directus fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getAvatars.mockRejectedValue(new Error("down"));
    await renderPage();
    expect(screen.getByRole("heading", { name: "Avatars" })).toBeInTheDocument();
    expect(screen.getByText("Avatars are unavailable right now.")).toBeInTheDocument();
  });
});
