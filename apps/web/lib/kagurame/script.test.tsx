import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

// Each test may swap the script's source or break the compiler
const swap = vi.hoisted(() => ({ source: null as string | Error | null, compileFails: false }))

vi.mock("fs/promises", async () => {
  const real = (await vi.importActual<typeof import("fs")>("fs")).promises
  const readFile = vi.fn((...args: Parameters<typeof real.readFile>) => {
    if (swap.source instanceof Error) return Promise.reject(swap.source)
    if (swap.source !== null) return Promise.resolve(swap.source)
    return real.readFile(...args)
  })
  return { ...real, readFile, default: { ...real, readFile } }
})

vi.mock("@/lib/blog/title", async (orig) => {
  const real = await orig<typeof import("@/lib/blog/title")>()
  return {
    ...real,
    compileTitle: vi.fn((title: string) =>
      swap.compileFails ? Promise.reject(new Error("boom")) : real.compileTitle(title)
    ),
  }
})

import { compileLine, formatProblem, loadKagurameScript } from "./script"

afterEach(() => {
  swap.source = null
  swap.compileFails = false
  vi.restoreAllMocks()
})

describe("loadKagurameScript", () => {
  it("prepares the real script with its glitching title", async () => {
    const script = await loadKagurameScript()
    expect(script).not.toBeNull()
    expect(script!.name.plain).toBe("Kagurame")
    expect(script!.subtitle!.plain).toBe("17th Company")
    expect(script!.fabula.scenes.map((s) => s.id)).toContain("ave")
    render(
      <p data-testid="title">
        {script!.name.node} · {script!.subtitle!.node}
      </p>
    )
    // The window starts OFF: the glitch words rest on their plain bases
    expect(screen.getByTestId("title")).toHaveTextContent("Kagurame · 17th Company")
    // The fourth opener glitches too
    expect(script!.lines["start:1:3"].plain).toBe("What is AVE?")
  })

  it("compiles a ?latest line whose post title glitches", async () => {
    const script = await loadKagurameScript({ title: "==Yeter|ENOUGH!==", slug: "yeter" })
    // No reading time: the second ?latest variant of `fresh` is the one said
    expect(script!.lines["fresh:1"].plain).toBe("The freshest scroll in the archive: «Yeter».")
    expect(script!.lines["fresh:0"]).toBeUndefined()
    expect(script!.latestPost).toEqual({ title: "==Yeter|ENOUGH!==", slug: "yeter" })
  })

  it("hides the dialogue when the script can't be read", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    swap.source = new Error("ENOENT")
    expect(await loadKagurameScript()).toBeNull()
    expect(log).toHaveBeenCalledWith(expect.stringContaining("can't read"), expect.any(Error))
  })

  it("hides the dialogue and logs the problems when the script is broken", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    swap.source = "@title Kagurame\n== start\nHi.\n* Hello. -> nowhere\n"
    expect(await loadKagurameScript()).toBeNull()
    const [message] = log.mock.calls[0]
    expect(message).toContain('line 4: error: no scene "nowhere"')
    expect(message).toContain("is broken, the dialogue is hidden")
  })

  it("keeps a title without a subtitle", async () => {
    swap.source = `@title Kagurame
== start
Hi.
* Hello. -> hello
* Where am I? -> where
* ... -> silence
* ==||What is AVE?|>Why color has changed?== -> ave
== hello
Hello.
* Blog. -> /blog
* Forum. -> /forum
* Projects. -> /projects
* Subscribe. -> /subscribe
== where
Here.
* Releases. -> #releases
== silence
Quiet.
* [Scroll on] -> #content
== ave
AVE.
* Back. -> start
`
    const script = await loadKagurameScript()
    expect(script!.name).toEqual({ plain: "Kagurame", node: "Kagurame" })
    expect(script!.subtitle).toBeUndefined()
    expect(Object.keys(script!.lines)).toEqual(["start:0:3"])
  })
})

describe("compileLine", () => {
  it("leaves plain lines alone", async () => {
    expect(await compileLine("Just words.")).toBeNull()
  })

  it("shows a line as written when it doesn't compile", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    swap.compileFails = true
    expect(await compileLine("==a|b==")).toBeNull()
    expect(log).toHaveBeenCalledWith(expect.stringContaining("can't compile"), expect.any(Error))
  })
})

describe("formatProblem", () => {
  it("names the line, or the script as a whole", () => {
    expect(formatProblem({ severity: "error", line: 3, message: "x" })).toBe("line 3: error: x")
    expect(formatProblem({ severity: "warning", line: 0, message: "y" })).toBe("script: warning: y")
  })
})
