import { describe, expect, it } from "vitest"
import { decideDestination, resolveLine, type Action, type NodeId } from "./dialogue"

const ctx = { returning: false }
const NODES: NodeId[] = ["start", "hello", "where", "silence", "who", "built", "fresh", "decided", "bye"]

describe("Kagurame dialogue", () => {
  it("opens with Hello, Where am I and silence", () => {
    expect(resolveLine("start", ctx).choices.map((c) => c.label)).toEqual(["Hello.", "Where am I?", "..."])
  })

  it("greets a returning visitor differently", () => {
    expect(resolveLine("start", { returning: true }).text).not.toBe(resolveLine("start", ctx).text)
  })

  it("never leads to a missing node or an empty line", () => {
    for (const id of NODES) {
      const line = resolveLine(id, ctx)
      expect(line.text.length).toBeGreaterThan(0)
      expect(line.choices.length).toBeGreaterThan(0)
      for (const { action } of line.choices) {
        if ("goto" in action) expect(NODES).toContain(action.goto)
      }
    }
  })

  it("reaches every main section from the tree", () => {
    const hrefs = new Set<string>()
    for (const id of NODES) {
      for (const { action } of resolveLine(id, { returning: false, latestPost: { title: "T", slug: "t" } }).choices) {
        if ("href" in action) hrefs.add(action.href)
      }
    }
    for (const href of ["/blog", "/forum", "/projects", "/subscribe", "/blog/t"]) {
      expect(hrefs).toContain(href)
    }
  })

  it("offers the latest post with its reading time", () => {
    const line = resolveLine("fresh", { returning: false, latestPost: { title: "Gladiators", slug: "gladiators", readingTime: 7 } })
    expect(line.text).toContain("«Gladiators»")
    expect(line.text).toContain("7 min")
    expect(line.choices[0].action).toEqual<Action>({ href: "/blog/gladiators" })
  })

  it("falls back to the blog when there is no latest post", () => {
    expect(resolveLine("fresh", ctx).choices[0].action).toEqual<Action>({ href: "/blog" })
  })

  it("decides a destination on his own", () => {
    expect(decideDestination(() => 0).href).toBe("/blog")
    expect(decideDestination(() => 0.99).href).toBe("/subscribe")
    const line = resolveLine("decided", { returning: false, random: () => 0.3 })
    expect(line.text).toMatch(/^Decided\./)
    expect(line.choices[0].action).toEqual<Action>({ href: "/forum" })
  })
})
