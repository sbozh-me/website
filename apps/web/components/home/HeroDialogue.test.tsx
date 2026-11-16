import { useState, type ReactNode } from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { setGlitchesEnabled, WindowButton } from "@/lib/blog/glitch/window"
import { loadKagurameScript, type KagurameScript } from "@/lib/kagurame/script"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

// Reduced motion by default: lines show at once. Off for the typing and spinning-mark tests.
const motionPref = vi.hoisted(() => ({ reduce: true }))
vi.mock("framer-motion", async (orig) => ({
  ...(await orig<typeof import("framer-motion")>()),
  useReducedMotion: () => motionPref.reduce,
  // Swap panels at once: exit animations don't finish in jsdom
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

import { HeroDialogue } from "./HeroDialogue"

const onScroll = vi.fn()

// The real script, prepared the way the home page prepares it
let script: KagurameScript
let withPost: KagurameScript
beforeAll(async () => {
  script = (await loadKagurameScript())!
  withPost = (await loadKagurameScript({ title: "Gladiators", slug: "gladiators" }))!
})

function Harness({
  initialOpen = true,
  script: given,
  toolbar,
}: {
  initialOpen?: boolean
  script?: KagurameScript | null
  toolbar?: ReactNode
}) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <>
      <HeroDialogue
        open={open}
        onOpenChange={setOpen}
        script={given === undefined ? script : given}
        onScroll={onScroll}
        toolbar={toolbar}
      />
      {/* The page's switch, as the site header holds it */}
      <WindowButton />
    </>
  )
}

beforeEach(() => {
  motionPref.reduce = true
  push.mockClear()
  onScroll.mockClear()
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  // The window is page-wide: the next test starts at the page's default
  act(() => setGlitchesEnabled(null))
})

describe("HeroDialogue", () => {
  it("greets a stranger with four replies", () => {
    render(<Harness />)
    expect(screen.getByRole("dialog", { name: "Kagurame" })).toHaveTextContent("three-dimensional")
    const replies = screen.getAllByRole("listitem").map((item) => item.textContent)
    expect(replies).toEqual(["1.Hello.", "2.Where am I?", "3....", "4.What is AVE?"])
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
    render(<Harness script={withPost} />)
    fireEvent.keyDown(window, { key: "1" }) // Hello.
    fireEvent.keyDown(window, { key: "2" }) // What's new?
    expect(screen.getByRole("dialog")).toHaveTextContent("«Gladiators»")
    fireEvent.keyDown(window, { key: "1" }) // Read it.
    expect(push).toHaveBeenCalledWith("/blog/gladiators")
  })

  it("answers What is AVE with a link to the repo in a new tab", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /What is AVE\?/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("A CLI that keeps agents focused")
    const link = screen.getByRole("link", { name: /Show me\./ })
    expect(link).toHaveAttribute("href", "https://github.com/sbozh/ave")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener")
    expect(link).toHaveAccessibleName(/opens in a new tab/)
    fireEvent.click(link)
    expect(window.localStorage.getItem("sbozh:kagurame:met")).toBe("1")
  })

  it("opens the repo from the keyboard too", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null)
    render(<Harness />)
    fireEvent.keyDown(window, { key: "4" }) // What is AVE?
    fireEvent.keyDown(window, { key: "1" }) // Show me.
    expect(open).toHaveBeenCalledWith("https://github.com/sbozh/ave", "_blank", "noopener")
  })

  it("lets him decide once, without reshuffling while he types", () => {
    motionPref.reduce = false
    vi.useFakeTimers()
    render(<Harness />)
    act(() => vi.advanceTimersByTime(5_000))
    fireEvent.click(screen.getByRole("button", { name: /^3\.\.\.\./ }))
    act(() => vi.advanceTimersByTime(5_000))
    // The blog when he decides; any later pick would say Subscribe instead
    const random = vi.spyOn(Math, "random").mockReturnValue(0)
    fireEvent.click(screen.getByRole("button", { name: /Let him decide/ }))
    random.mockReturnValue(0.99)
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByRole("dialog")).toHaveTextContent("Decided. The blog. Read something you didn't come for.")
    expect(screen.getByRole("button", { name: /Go to the blog\./ })).toBeInTheDocument()
  })

  it("closes on !close", () => {
    render(<Harness script={withPost} />)
    fireEvent.click(screen.getByRole("button", { name: /Hello\./ }))
    fireEvent.click(screen.getByRole("button", { name: /What's new\?/ }))
    fireEvent.click(screen.getByRole("button", { name: /Later\./ }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(onScroll).not.toHaveBeenCalled()
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

  it("stays away when his script is broken, leaving the toolbar", () => {
    render(<Harness script={null} toolbar={<button>Pause</button>} />)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.queryByRole("button", { name: /Talk to Kagurame/ })).toBeNull()
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument()
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

describe("HeroDialogue glitch lines", () => {
  // The stranger's greeting, compiled as if it had glitch syntax
  const rich = () => ({
    ...script,
    lines: {
      "start:1": { plain: "Oh. A plain line.", open: "Oh. An open line.", node: <em>Oh. A glitching line.</em> },
    },
  })

  it("types the plain text, then swaps in the rendered line", () => {
    motionPref.reduce = false
    vi.useFakeTimers()
    render(<Harness script={rich()} />)
    act(() => vi.advanceTimersByTime(22 * 5))
    expect(screen.getByRole("dialog")).toHaveTextContent("Oh. A")
    expect(screen.queryByText("Oh. A glitching line.")).toBeNull()
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByText("Oh. A glitching line.").tagName).toBe("EM")
  })

  it("shows the rendered line at once under reduced motion", () => {
    render(<Harness script={rich()} />)
    expect(screen.getByText("Oh. A glitching line.")).toBeInTheDocument()
  })
})

describe("HeroDialogue with the window ON", () => {
  const openWindow = () => fireEvent.click(screen.getByRole("button", { name: /Window OFF/ }))

  it("asks about colour instead of AVE, and takes the glitch path", () => {
    render(<Harness />)
    expect(screen.getByRole("button", { name: /What is AVE\?/ })).toBeInTheDocument()
    openWindow()
    fireEvent.click(screen.getByRole("button", { name: /Why color has changed\?/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("You opened the window")
  })

  it("takes the usual path with the window closed", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /What is AVE\?/ }))
    expect(screen.getByRole("dialog")).toHaveTextContent("A CLI that keeps agents focused")
  })

  it("takes the glitch path from the keyboard too", () => {
    render(<Harness />)
    fireEvent.keyDown(window, { key: "1" }) // Hello.
    openWindow()
    fireEvent.keyDown(window, { key: "4" }) // I quit.
    expect(screen.getByRole("dialog")).toHaveTextContent("I resigned sixteen times")
  })

  it("leaves nothing grey: replies, the separator and the close button turn white", () => {
    render(<Harness />)
    const dialog = screen.getByRole("dialog")
    const greys = () => dialog.querySelectorAll(".text-muted-foreground").length
    const hello = screen.getByRole("button", { name: /Hello\./ })
    expect(dialog).toHaveAttribute("data-window", "off")
    expect(hello).toHaveClass("text-muted-foreground")
    expect(greys()).toBeGreaterThan(0)
    openWindow()
    expect(dialog).toHaveAttribute("data-window", "on")
    expect(hello).toHaveClass("text-foreground")
    expect(screen.getByRole("button", { name: "Close dialogue" })).toHaveClass("text-foreground")
    expect(hello.querySelector("span")).toHaveClass("text-primary")
    expect(greys()).toBe(0)
  })

  it("types his glitch words the way they read with the window open", () => {
    window.localStorage.setItem("sbozh:kagurame:met", "1")
    motionPref.reduce = false
    vi.useFakeTimers()
    render(<Harness />)
    openWindow()
    act(() => vi.advanceTimersByTime(22 * 40))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveTextContent("Still my 17th legion")
    expect(dialog).not.toHaveTextContent("17th company")
  })

  it("stays finished when the window flips after the line is typed", () => {
    motionPref.reduce = false
    vi.useFakeTimers()
    render(<Harness />)
    act(() => vi.advanceTimersByTime(5_000))
    // The window-ON reading of the greeting is longer than the one just typed
    openWindow()
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByRole("dialog")).toHaveTextContent("three-dimensional with the window open")
    expect(screen.getByRole("list", { name: "Replies" })).toHaveClass("opacity-100")
  })

  it("keeps typing when the window flips mid-line", () => {
    window.localStorage.setItem("sbozh:kagurame:met", "1")
    motionPref.reduce = false
    vi.useFakeTimers()
    render(<Harness />)
    act(() => vi.advanceTimersByTime(22 * 20))
    openWindow()
    act(() => vi.advanceTimersByTime(22 * 20))
    // 40 characters in, not 20 from a fresh start
    expect(screen.getByRole("dialog")).toHaveTextContent("You came back. Still my 17th legion. Si")
  })
})

describe("HeroDialogue window", () => {
  it("keeps his page's window closed: the header reads OFF, his title 17th Company", () => {
    render(<Harness />)
    expect(screen.getByRole("button", { name: /Window OFF/ })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("dialog")).toHaveTextContent("17th Company")
    // The switch is the header's, not in his box
    expect(screen.getByRole("dialog").querySelector(".window-toggle")).toBeNull()
  })

  it("leaves the window open on a page where his script is broken", () => {
    render(<Harness script={null} />)
    expect(screen.getByRole("button", { name: /Window ON/ })).toHaveAttribute("aria-pressed", "true")
  })

  it("opens the window with the button", () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: /Window OFF/ }))
    expect(screen.getByRole("button", { name: /Window ON/ })).toHaveAttribute("aria-pressed", "true")
  })
})
