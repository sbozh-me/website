import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { PostListItem, Series } from "@sbozh/blog/types"

import type { Project } from "@/lib/projects/types"

import { SeriesPromo } from "./SeriesPromo"

const project: Project = {
  slug: "renesans-inter",
  title: "Renesans Inter",
  tagline: "A calmer front door",
  status: "coming-soon",
  version: "0.2.0",
  heroImage: { src: "/hero.png", headerSrc: "/header.png", alt: "Renesans wordmark" },
  meta: [],
  tabs: [],
}

const makePost = (slug: string): PostListItem => ({
  id: slug,
  title: slug,
  slug,
  excerpt: "",
  date: "2026-09-24",
  readingTime: 7,
  persona: { id: "1", name: "Pan Dude", slug: "pan-dude", color: "#f59e0b" },
  tags: [],
  seriesId: "s1",
  image: { src: "/api/assets/post-hero", alt: "post-hero.png", width: 1600, height: 900 },
})

const makeSeries = (slug: string, extra: Partial<Series> = {}) => ({
  series: {
    id: slug,
    title: `Title ${slug}`,
    slug,
    description: `About ${slug}`,
    image: { src: `/api/assets/${slug}`, alt: `${slug}.png`, width: 1600, height: 900 },
    status: "finished" as const,
    ...extra,
  },
  posts: [makePost(`${slug}-1`)],
})

describe("SeriesPromo", () => {
  it("renders nothing when no slot is filled", () => {
    const { container } = render(<SeriesPromo />)

    expect(container).toBeEmptyDOMElement()
  })

  it("lays out the big series like its series page header", () => {
    render(<SeriesPromo big={makeSeries("pan-dude")} />)

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/blog/series/pan-dude")
    expect(within(link).getByRole("heading", { level: 2 })).toHaveTextContent("Title pan-dude")
    expect(within(link).getByText("About pan-dude")).toBeInTheDocument()

    // Status badge sits on the Hero image: its positioned box holds the image (the
    // badge's theme-island wrapper in between is display: contents, so it has no box)
    const badge = within(link).getByText("Finished")
    expect(badge).toHaveClass("absolute")
    expect(badge.closest(".relative")).toContainElement(screen.getByAltText("pan-dude.png"))
  })

  it("puts left and right under the big one, in that order", () => {
    render(
      <SeriesPromo
        big={makeSeries("big")}
        left={makeSeries("left", { status: "ongoing" })}
        right={makeSeries("right", { status: undefined })}
      />
    )

    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/blog/series/big",
      "/blog/series/left",
      "/blog/series/right",
    ])
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Title left",
      "Title right",
    ])
    expect(screen.getByText("Ongoing")).toHaveAttribute("data-status", "ongoing")
    expect(screen.getAllByText("Finished")).toHaveLength(1)
  })

  it("shows the smaller cards alone when there is no big one", () => {
    render(<SeriesPromo right={makeSeries("right")} />)

    // The only h2 left is the section title
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("My current focus")
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title right")
  })

  it("names the section after its title", () => {
    render(<SeriesPromo big={makeSeries("big")} title="Coming Soon" />)

    expect(screen.getByRole("region", { name: "Coming Soon" })).toBeInTheDocument()
  })

  it("shows the project in focus under the series, linking to its page", () => {
    render(<SeriesPromo left={makeSeries("left")} right={makeSeries("right")} project={project} />)

    const links = screen.getAllByRole("link")
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/blog/series/left",
      "/blog/series/right",
      "/projects/renesans-inter",
    ])

    const card = within(links[2])
    expect(card.getByRole("heading", { level: 3 })).toHaveTextContent("Renesans Inter")
    expect(card.getByText("A calmer front door")).toBeInTheDocument()
    expect(card.getByText("v0.2.0")).toBeInTheDocument()
    expect(card.getByText("Coming Soon")).toBeInTheDocument()
    // The wide header image, not the card one that carries its own text
    expect(card.getByAltText("Renesans wordmark")).toHaveAttribute("src", expect.stringContaining("header.png"))
  })

  it("shows the project alone when no series is promoted", () => {
    render(<SeriesPromo project={{ ...project, version: undefined, heroImage: { src: "/hero.png", alt: "Hero" } }} />)

    expect(screen.getByRole("region", { name: "My current focus" })).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/renesans-inter")
    expect(screen.getByAltText("Hero")).toHaveAttribute("src", expect.stringContaining("hero.png"))
    expect(screen.queryByText(/^v/)).not.toBeInTheDocument()
  })

  it("falls back to the placeholder, not a post image, without a series Hero", () => {
    const { container } = render(
      <SeriesPromo big={makeSeries("bare", { image: undefined, description: undefined })} />
    )

    expect(container.querySelector("img")).toBeNull()
    expect(screen.queryByText("About bare")).not.toBeInTheDocument()
  })
})
