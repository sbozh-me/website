import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HomePoster } from "./HomePoster"

const poster = {
  src: "/images/home/poster.png",
  alt: "GTA is near",
  width: 853,
  height: 1280,
}

const reducedMotion = (matches: boolean) =>
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches })))

const flipCard = () => document.querySelector("[data-poster-card]") as HTMLElement

describe("HomePoster", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("opens as a placeholder ad slot, with the example poster hidden behind it", () => {
    render(<HomePoster {...poster} />)

    expect(screen.getByRole("region", { name: "Commercial Promotions" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Commercial Promotions" })).toBeInTheDocument()
    // Placeholder face is the clickable invitation
    expect(
      screen.getByRole("button", { name: /your commercial here/i }),
    ).toBeInTheDocument()
    // The example image is still rendered (behind, aria-hidden), so a11y queries that opt
    // out of hidden elements shouldn't see it as the primary content
    expect(screen.queryByRole("img", { name: "GTA is near" })).not.toBeInTheDocument()
  })

  it("flips to the example poster when the placeholder is clicked", () => {
    render(<HomePoster {...poster} href="/library/journal/gta-is-near" />)

    fireEvent.click(screen.getByRole("button", { name: /your commercial here/i }))

    // After the flip, the example face is revealed and its link becomes reachable
    const link = screen.getByRole("link", { name: /gta is near/i })
    expect(link).toHaveAttribute("href", "/library/journal/gta-is-near")
    expect(screen.getByRole("button", { name: /flip back/i })).toBeInTheDocument()
  })

  it("leans towards the mouse and straightens when it leaves", () => {
    reducedMotion(false)
    render(<HomePoster {...poster} />)
    const el = flipCard()
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 600 }) as DOMRect

    fireEvent.pointerMove(el, { pointerType: "mouse", clientX: 400, clientY: 0 })
    expect(el.style.getPropertyValue("--poster-ry")).toBe("5.00deg")
    expect(el.style.getPropertyValue("--poster-rx")).toBe("4.00deg")
    expect(el.style.getPropertyValue("--poster-mx")).toBe("100.0%")

    fireEvent.pointerLeave(el)
    expect(el.style.getPropertyValue("--poster-ry")).toBe("")
    expect(el.style.getPropertyValue("--poster-rx")).toBe("")
  })

  it("stays still for touch and for reduced motion", () => {
    reducedMotion(true)
    render(<HomePoster {...poster} />)
    const el = flipCard()

    fireEvent.pointerMove(el, { pointerType: "touch", clientX: 10, clientY: 10 })
    fireEvent.pointerMove(el, { pointerType: "mouse", clientX: 10, clientY: 10 })

    expect(el.style.getPropertyValue("--poster-ry")).toBe("")
  })
})
