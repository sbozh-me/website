import { useState, type ReactNode } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

// Reduced motion by default: lines show at once. Off for the spinning-mark test.
const motionPref = vi.hoisted(() => ({ reduce: true }))
vi.mock("framer-motion", async (orig) => ({
  ...(await orig<typeof import("framer-motion")>()),
  useReducedMotion: () => motionPref.reduce,
  // Swap panels at once: exit animations don't finish in jsdom
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import { HeroDialogue } from "./HeroDialogue"

const onScroll = vi.fn()

function Harness({
  initialOpen = true,
  latestPost,
  toolbar,
}: {
  initialOpen?: boolean
  latestPost?: { title: string; slug: string }
  toolbar?: ReactNode
}) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <HeroDialogue open={open} onOpenChange={setOpen} latestPost={latestPost} onScroll={onScroll} toolbar={toolbar} />
  )
}

beforeEach(() => {
  motionPref.reduce = true
  push.mockClear()
  onScroll.mockClear()
  window.localStorage.clear()
})

describe("HeroDialogue", () => {
  it("greets a stranger with three replies", () => {
    render(<Harness />)
    expect(screen.getByRole("dialog", { name: "Kagurame" })).toHaveTextContent("three-dimensional")
    expect(screen.getByRole("button", { name: /Hello\./ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Where am I\?/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /\.\.\./ })).toBeInTheDocument()
  })

  it("walks the tree and navigates", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /Where am I\?/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("personal startup")
    fireEvent.click(screen.getByRole("button", { name: /Who runs this place\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /Enter the Forum\./ }))
    expect(push).toHaveBeenCalledWith("/forum")
  })

  it("picks replies with number keys", () => {
    render(<Harness latestPost={{ title: "Gladiators", slug: "gladiators" }} />)
    fireEvent.keyDown(window, { key: "1" }) // Hello.
    fireEvent.keyDown(window, { key: "2" }) // What's new?
    expect(screen.getByRole("dialog")).toHaveTextContent("«Gladiators»")
    fireEvent.keyDown(window, { key: "1" }) // Read it.
    expect(push).toHaveBeenCalledWith("/blog/gladiators")
  })

  it("scrolls to the release notes and tucks away", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /Where am I\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /What gets built here\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /release notes/ }))
    expect(onScroll).toHaveBeenCalledWith("releases")
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("tucks away on Escape and starts over as a returning visitor", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /Hello\./ }))
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByRole("dialog")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Talk to Kagurame/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("You came back")
  })

  it("starts closed when the hero says so", () => {
    render(<Harness initialOpen={false} />)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByRole("button", { name: /Talk to Kagurame/ })).toBeInTheDocument()
  })

  it("reads Ave with the brand mark spinning", () => {
    motionPref.reduce = false
    render(<Harness initialOpen={false} />)
    const talk = screen.getByRole("button", { name: /Talk to Kagurame/ })
    const mark = talk.querySelector("[data-spinning]")
    expect(mark).not.toBeNull()
    expect(mark!.querySelector("img")).toHaveAttribute("src", expect.stringContaining("android-chrome-192x192.png"))
    expect(talk).toHaveTextContent(/^Ave$/)
  })

  it("keeps the mark still under reduced motion", () => {
    render(<Harness initialOpen={false} />)
    const talk = screen.getByRole("button", { name: /Talk to Kagurame/ })
    expect(talk.querySelector("img")).not.toBeNull()
    expect(talk.querySelector("[data-spinning]")).toBeNull()
  })

  it("puts the toolbar above the dialogue and the Talk button", () => {
    const { unmount } = render(<Harness toolbar={<button>Pause</button>} />)
    const dialog = screen.getByRole("dialog")
    expect(screen.getByRole("button", { name: "Pause" }).compareDocumentPosition(dialog)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
    unmount()
    render(<Harness initialOpen={false} toolbar={<button>Pause</button>} />)
    const talk = screen.getByRole("button", { name: /Talk to Kagurame/ })
    expect(screen.getByRole("button", { name: "Pause" }).compareDocumentPosition(talk)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })
})

describe("HeroDialogue window", () => {
  it("starts with the window OFF: his title reads 17th Company", () => {
    render(<Harness />)
    expect(screen.getByRole("button", { name: /Window OFF/ })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("dialog")).toHaveTextContent("17th Company")
  })

  it("opens the window with the button", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /Window OFF/ }))
    expect(screen.getByRole("button", { name: /Window ON/ })).toHaveAttribute("aria-pressed", "true")
  })
})
