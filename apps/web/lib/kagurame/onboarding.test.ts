import { readdirSync, readFileSync } from "fs"
import { resolve } from "path"
import { describe, expect, it } from "vitest"
import { OPENERS, parseFabula, resolveScene, routeFromPageFile, validateFabula, type Target } from "./fabula"

// The real script: an edit that breaks the graph fails CI here
const SOURCE = readFileSync(resolve(__dirname, "../../content/kagurame/onboarding.fabula"), "utf-8")
const APP = resolve(__dirname, "../../app")
const ROUTES = (readdirSync(APP, { recursive: true }) as string[])
  .map(routeFromPageFile)
  .filter((route): route is string => route !== null)

const { fabula, problems } = parseFabula(SOURCE)
const stranger = { returning: false }
const post = { title: "Gladiators", slug: "gladiators", readingTime: 7 }

describe("Kagurame's onboarding script", () => {
  it("parses and validates against the app's routes", () => {
    const all = [...problems, ...validateFabula(fabula, { routes: ROUTES })]
    expect(all.filter((p) => p.severity === "error")).toEqual([])
    // The author's hello line is longer than a phone likes; nothing else is
    expect(all.filter((p) => p.severity === "warning").map((p) => p.line)).toEqual([
      fabula.scenes.find((s) => s.id === "hello")!.variants[0].line,
    ])
  })

  it("opens with Hello, Where am I, silence and What is AVE", () => {
    const openers = OPENERS.map((o) => o.label)
    expect(resolveScene(fabula, "start", stranger).choices.map((c) => c.label)).toEqual(openers)
    expect(resolveScene(fabula, "start", { returning: true }).choices.map((c) => c.label)).toEqual(openers)
  })

  it("greets a returning visitor differently", () => {
    expect(resolveScene(fabula, "start", { returning: true }).text).toMatch(/^You came back/)
    expect(resolveScene(fabula, "start", stranger).text).toMatch(/three-dimensional/)
  })

  it("answers What is AVE with the repo", () => {
    const ave = resolveScene(fabula, "ave", stranger)
    expect(ave.text).toMatch(/^AVE\. A CLI/)
    expect(ave.choices[0]).toEqual({
      label: "Show me.",
      target: { kind: "external", href: "https://github.com/sbozh/ave" },
    })
  })

  it("offers the latest post with its reading time", () => {
    const line = resolveScene(fabula, "fresh", { ...stranger, latestPost: post })
    expect(line.text).toBe("The freshest scroll in the archive: «Gladiators». About 7 min of your dimension.")
    expect(line.choices[0].target).toEqual<Target>({ kind: "route", href: "/blog/gladiators" })
  })

  it("drops the minutes when the post has no reading time", () => {
    const line = resolveScene(fabula, "fresh", { ...stranger, latestPost: { title: "Gladiators", slug: "gladiators" } })
    expect(line.text).toBe("The freshest scroll in the archive: «Gladiators».")
    expect(line.choices[0].target).toEqual<Target>({ kind: "route", href: "/blog/gladiators" })
  })

  it("falls back to the library when there is no latest post", () => {
    expect(resolveScene(fabula, "fresh", stranger).choices[0].target).toEqual<Target>({ kind: "route", href: "/library" })
  })

  it("decides a destination on his own", () => {
    const decide = (r: number) => resolveScene(fabula, "decided", { ...stranger, random: () => r })
    expect(decide(0).choices[0].target).toEqual<Target>({ kind: "route", href: "/library" })
    expect(decide(0.3).choices[0].target).toEqual<Target>({ kind: "route", href: "/forum" })
    expect(decide(0.6).choices[0].target).toEqual<Target>({ kind: "route", href: "/projects" })
    expect(decide(0.99).choices[0].target).toEqual<Target>({ kind: "route", href: "/subscribe" })
    expect(decide(0.3).text).toMatch(/^Decided\./)
  })
})
