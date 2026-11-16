import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HomePoster } from "./HomePoster"

const poster = { src: "/images/home/poster.png", alt: "GTA is near", width: 853, height: 1280 }

const reducedMotion = (matches: boolean) =>
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches })))

const card = () => screen.getByRole("img", { name: "GTA is near" }).parentElement!

describe("HomePoster", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("shows the poster as a plain picture without a link", () => {
    render(<HomePoster {...poster} />)

    expect(screen.getByRole("region", { name: "Commercial Promotions" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Commercial Promotions" })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "GTA is near" })).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("links the poster when it has somewhere to lead", () => {
    render(<HomePoster {...poster} href="/blog/gta-is-near" />)

    expect(screen.getByRole("link", { name: "GTA is near" })).toHaveAttribute("href", "/blog/gta-is-near")
  })

  it("leans towards the mouse and straightens when it leaves", () => {
    reducedMotion(false)
    render(<HomePoster {...poster} />)
    const el = card()
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
    const el = card()

    fireEvent.pointerMove(el, { pointerType: "touch", clientX: 10, clientY: 10 })
    fireEvent.pointerMove(el, { pointerType: "mouse", clientX: 10, clientY: 10 })

    expect(el.style.getPropertyValue("--poster-ry")).toBe("")
  })
})
