import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { PostListItem, Series } from "@sbozh/blog/types"

import { SeriesPromo } from "./SeriesPromo"

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

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title right")
  })

  it("falls back to the placeholder, not a post image, without a series Hero", () => {
    const { container } = render(
      <SeriesPromo big={makeSeries("bare", { image: undefined, description: undefined })} />
    )

    expect(container.querySelector("img")).toBeNull()
    expect(screen.queryByText("About bare")).not.toBeInTheDocument()
  })
})
