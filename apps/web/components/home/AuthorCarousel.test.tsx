import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Author } from "@/types/author"
import { AuthorCarousel } from "./AuthorCarousel"

const authors: Author[] = [
  { id: "a", name: "Ann", title: "One", description: "First", ctaButtons: [], blogAuthorSlugs: [] },
  { id: "b", name: "Bob", title: "Two", description: "Second", ctaButtons: [], blogAuthorSlugs: [] },
]

// matchMedia for Tailwind's md: `desktop.matches` is what the carousel reads
const desktop = vi.hoisted(() => ({
  matches: false,
  listeners: new Set<() => void>(),
}))

// The ResizeObserver callbacks, to fire them by hand
const observers = vi.hoisted(() => [] as Array<{ callback: () => void; targets: Element[] }>)

function slide() {
  return screen.getByLabelText("Previous author").nextElementSibling as HTMLElement
}

beforeEach(() => {
  desktop.matches = false
  desktop.listeners.clear()
  observers.length = 0

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return desktop.matches
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => desktop.listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => desktop.listeners.delete(fn),
  })) as unknown as typeof window.matchMedia

  vi.stubGlobal(
    "ResizeObserver",
    class {
      entry: { callback: () => void; targets: Element[] }
      constructor(callback: () => void) {
        this.entry = { callback, targets: [] }
        observers.push(this.entry)
      }
      observe(target: Element) {
        this.entry.targets.push(target)
      }
      unobserve() {}
      disconnect() {
        this.entry.targets = []
      }
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("AuthorCarousel sizing", () => {
  it("takes the full width on phones, whatever innerWidth says while the page loads", () => {
    // A phone's layout viewport can report a desktop width during load
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(980)
    render(<AuthorCarousel authors={authors} />)

    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 48rem)")
    expect(slide().style.width).toBe("100%")
    expect(slide().className).not.toContain("px-12")
  })

  it("uses the measured width on desktop", () => {
    desktop.matches = true
    render(<AuthorCarousel authors={authors} />)

    expect(slide().style.width).not.toBe("100%")
    expect(slide().className).toContain("px-12")
  })

  it("switches to the phone layout when the breakpoint stops matching", () => {
    desktop.matches = true
    render(<AuthorCarousel authors={authors} />)
    expect(slide().style.width).not.toBe("100%")

    desktop.matches = false
    act(() => desktop.listeners.forEach((fn) => fn()))
    expect(slide().style.width).toBe("100%")
  })

  it("re-measures the cards when their box changes size", () => {
    let height = 400
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(() => height)
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => 300)
    render(<AuthorCarousel authors={authors} />)
    expect(slide().style.height).toBe("400px")

    const measure = observers.find((o) => o.targets.length > 0)
    expect(measure?.targets[0]).toHaveAttribute("aria-hidden", "true")

    height = 560
    act(() => measure!.callback())
    expect(slide().style.height).toBe("560px")
  })
})
