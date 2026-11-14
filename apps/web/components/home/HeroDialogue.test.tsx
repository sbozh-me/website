import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
// Reduced motion: the line shows at once and he speaks without the opening delay
vi.mock("framer-motion", async (orig) => ({
  ...(await orig<typeof import("framer-motion")>()),
  useReducedMotion: () => true,
  // Swap panels at once: exit animations don't finish in jsdom
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { HeroDialogue } from "./HeroDialogue"

const onScroll = vi.fn()

function renderDialogue(latestPost?: { title: string; slug: string }) {
  render(<HeroDialogue latestPost={latestPost} onScroll={onScroll} />)
  act(() => vi.runOnlyPendingTimers())
}

beforeEach(() => {
  vi.useFakeTimers()
  push.mockClear()
  onScroll.mockClear()
  window.localStorage.clear()
})

afterEach(() => vi.useRealTimers())

describe("HeroDialogue", () => {
  it("greets a stranger with three replies", () => {
    renderDialogue()
    expect(screen.getByRole("dialog", { name: "Kagurame" })).toHaveTextContent("three-dimensional")
    expect(screen.getByRole("button", { name: /Hello\./ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Where am I\?/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /\.\.\./ })).toBeInTheDocument()
  })

  it("walks the tree and navigates", () => {
    renderDialogue()
    fireEvent.click(screen.getByRole("button", { name: /Where am I\?/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("personal startup")
    fireEvent.click(screen.getByRole("button", { name: /Who runs this place\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /Enter the Forum\./ }))
    expect(push).toHaveBeenCalledWith("/forum")
  })

  it("picks replies with number keys", () => {
    renderDialogue({ title: "Gladiators", slug: "gladiators" })
    fireEvent.keyDown(window, { key: "1" }) // Hello.
    fireEvent.keyDown(window, { key: "2" }) // What's new?
    expect(screen.getByRole("dialog")).toHaveTextContent("«Gladiators»")
    fireEvent.keyDown(window, { key: "1" }) // Read it.
    expect(push).toHaveBeenCalledWith("/blog/gladiators")
  })

  it("scrolls to the release notes", () => {
    renderDialogue()
    fireEvent.click(screen.getByRole("button", { name: /Where am I\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /What gets built here\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /release notes/ }))
    expect(onScroll).toHaveBeenCalledWith("releases")
  })

  it("tucks away on Escape and comes back as a returning visitor", () => {
    renderDialogue()
    fireEvent.click(screen.getByRole("button", { name: /Hello\./ }))
    fireEvent.keyDown(window, { key: "Escape" })
    act(() => vi.runOnlyPendingTimers())
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Talk to Kagurame/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("You came back")
  })
})

describe("HeroDialogue window", () => {
  it("starts with the window OFF: his title reads 17th Company", () => {
    renderDialogue()
    expect(screen.getByRole("button", { name: /Window OFF/ })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("dialog")).toHaveTextContent("17th Company")
  })

  it("opens the window with the button", () => {
    renderDialogue()
    fireEvent.click(screen.getByRole("button", { name: /Window OFF/ }))
    expect(screen.getByRole("button", { name: /Window ON/ })).toHaveAttribute("aria-pressed", "true")
  })
})
