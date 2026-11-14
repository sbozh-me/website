import { describe, expect, it } from "vitest"
import {
  fillPlaceholders,
  matchesRoute,
  parseFabula,
  parseTarget,
  readGlitch,
  resolveScene,
  routeFromPageFile,
  splitTitle,
  validateFabula,
  type Problem,
} from "./fabula"

// The smallest script that passes: four openers, every must-reach place
const BASE = `# a comment
@title Kagurame · ==17th Company|17th Dimension==

== start
Hi.
* Hello. -> hello
* Where am I? -> where
* ... -> silence
* ==||What is AVE?|>Why color has changed?== -> ==ave|>color==

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
\\...
* [Scroll on] -> #content

== ave
AVE.
* Show me. -> https://github.com/sbozh/ave
* Back. -> start

== color
Colours.
* Back. -> start
`

const ROUTES = ["/", "/blog", "/blog/[slug]", "/forum", "/projects", "/subscribe"]

function check(source: string, routes: string[] | undefined = ROUTES): Problem[] {
  const { fabula, problems } = parseFabula(source)
  return [...problems, ...validateFabula(fabula, { routes })]
}

function errors(source: string, routes?: string[]) {
  return check(source, routes)
    .filter((p) => p.severity === "error")
    .map((p) => `${p.line}: ${p.message}`)
}

/** BASE with one more scene, reached from `where` */
function withScene(scene: string, reply = "* More. -> extra") {
  return BASE.replace("* Releases. -> #releases", `* Releases. -> #releases\n${reply}`) + `\n${scene}\n`
}

/** The line `== extra` lands on in withScene */
const X = withScene("== extra").split("\n").indexOf("== extra") + 1

describe("parseFabula", () => {
  it("reads the title, scenes, variants and replies", () => {
    const { fabula, problems } = parseFabula(BASE)
    expect(problems).toEqual([])
    expect(fabula.title).toBe("Kagurame · ==17th Company|17th Dimension==")
    expect(fabula.titleLine).toBe(2)
    expect(fabula.scenes.map((s) => s.id)).toEqual(["start", "hello", "where", "silence", "ave", "color"])
    const [start] = fabula.scenes
    expect(start.line).toBe(4)
    expect(start.variants).toHaveLength(1)
    expect(start.variants[0]).toMatchObject({ kind: "default", text: "Hi.", line: 5 })
    expect(start.variants[0].choices[0]).toEqual({
      label: "Hello.",
      target: { kind: "scene", scene: "hello" },
      line: 6,
    })
  })

  it("unescapes a line that starts with a marker", () => {
    const { fabula } = parseFabula(BASE)
    expect(fabula.scenes[3].variants[0].text).toBe("...")
  })

  it("reads condition and pool markers", () => {
    const { fabula, problems } = parseFabula(`== a
?returning Again.
* Go. -> a
?latest New: {latest.title}.
* Go. -> a
~ One.
* Go. -> a
~   Two.
* Go. -> a`)
    expect(problems).toEqual([])
    expect(fabula.scenes[0].variants.map((v) => [v.kind, v.text])).toEqual([
      ["returning", "Again."],
      ["latest", "New: {latest.title}."],
      ["random", "One."],
      ["random", "Two."],
    ])
  })

  it("reads a glitch target: another path with the window ON", () => {
    const { fabula, problems } = parseFabula("== a\nLine.\n* ==Bye.|>I quit.== -> ==bye|>/projects==")
    expect(problems).toEqual([])
    expect(fabula.scenes[0].variants[0].choices[0]).toMatchObject({
      target: { kind: "scene", scene: "bye" },
      openTarget: { kind: "route", href: "/projects" },
    })
  })

  it("explains a glitch target that isn't ==closed|>open==", () => {
    const { problems } = parseFabula("== a\nLine.\n* Go. -> ==bye|resign==\n* Go. -> ==bye|>!open==")
    expect(problems.map((p) => `${p.line}: ${p.message}`)).toEqual([
      '3: glitch target "==bye|resign==" must read ==closed|>open==, e.g. ==ave|>color==',
      '4: unknown command "!open": only !close exists',
    ])
  })

  it("splits a reply on its last arrow", () => {
    const { fabula } = parseFabula("== a\nLine.\n* Left -> right? -> a")
    expect(fabula.scenes[0].variants[0].choices[0].label).toBe("Left -> right?")
  })

  it("reports malformed lines with their line numbers", () => {
    const { problems } = parseFabula(`@author me
Floating line.
== Bad_Id
== a
* Orphan. -> a
?maybe Hmm.
Line.
* No arrow
* -> a
* Broken. -> http://example.com
== a
@title One
@title Two
@title
~
`)
    expect(problems.map((p) => `${p.line}: ${p.message}`)).toEqual([
      "1: unknown directive @author: only @title exists",
      "2: a line outside a scene: start one with == id",
      '3: scene id "Bad_Id" must be lowercase letters, digits and dashes, starting with a letter',
      "5: a reply needs a line above it",
      "6: unknown condition ?maybe: use ?returning or ?latest",
      "8: a reply needs a target: * label -> target",
      "9: a reply needs a label",
      '10: external link "http://example.com" must use https://',
      '11: scene "a" is already defined on line 4',
      "13: @title is already set on line 12",
      "14: @title is empty",
      "15: a line with a marker but nothing to say",
    ])
    expect(problems.every((p) => p.severity === "error")).toBe(true)
  })
})

describe("parseTarget", () => {
  it("knows every kind of target", () => {
    expect(parseTarget("hello")).toEqual({ kind: "scene", scene: "hello" })
    expect(parseTarget("/blog")).toEqual({ kind: "route", href: "/blog" })
    expect(parseTarget("{latest.href}")).toEqual({ kind: "route", href: "{latest.href}" })
    expect(parseTarget("https://github.com/sbozh/ave")).toEqual({
      kind: "external",
      href: "https://github.com/sbozh/ave",
    })
    expect(parseTarget("#content")).toEqual({ kind: "scroll", to: "content" })
    expect(parseTarget("#releases")).toEqual({ kind: "scroll", to: "releases" })
    expect(parseTarget("!close")).toEqual({ kind: "close" })
  })

  it("explains what isn't a target", () => {
    expect(parseTarget("")).toMatch(/needs a target/)
    expect(parseTarget("/a b")).toMatch(/has a space/)
    expect(parseTarget("!open")).toMatch(/only !close exists/)
    expect(parseTarget("#top")).toMatch(/use #content or #releases/)
    expect(parseTarget("Scene")).toMatch(/is not a scene id/)
  })
})

describe("validateFabula", () => {
  it("passes the base script", () => {
    expect(check(BASE)).toEqual([])
  })

  it("needs a title and a start", () => {
    expect(errors("== a\nLine.\n* Go. -> a")).toEqual([
      "0: no @title: the dialogue box needs one",
      '0: no "start" scene: Kagurame has nowhere to begin',
    ])
  })

  it("rejects unknown scenes, unreachable scenes and dead ends", () => {
    expect(errors(withScene("== extra\nLine.", "* More. -> nowhere"))).toEqual([
      '21: no scene "nowhere"',
      `${X}: scene "extra" can't be reached from start`,
      `${X + 1}: dead end in "extra": a line needs at least one reply`,
    ])
  })

  it("rejects a scene with nothing to say", () => {
    expect(errors(withScene("== extra"))).toEqual([`${X}: scene "extra" says nothing`])
  })

  it("needs a fallback when no condition holds, and only one kind of it", () => {
    expect(errors(withScene("== extra\n?returning Again.\n* Back. -> start"))).toEqual([
      `${X}: scene "extra" has nothing to say when no condition holds: add an unmarked or ~ line`,
    ])
    expect(errors(withScene("== extra\nOne.\n* Back. -> start\nTwo.\n* Back. -> start"))).toEqual([
      `${X + 3}: scene "extra" has a second unmarked line: only the first is ever said`,
    ])
    expect(errors(withScene("== extra\nOne.\n* Back. -> start\n~ Two.\n* Back. -> start"))).toEqual([
      `${X + 3}: scene "extra" mixes a ~ pool with an unmarked line: pick one`,
    ])
  })

  it("keeps placeholders to ?latest lines", () => {
    expect(
      errors(
        withScene(
          "== extra\n?latest {latest.slug}\n* Read {latest.title}. -> {latest.href}\nNew: {latest.title}.\n* Go. -> {latest.href}"
        )
      )
    ).toEqual([
      `${X + 1}: unknown placeholder {latest.slug}: use title, minutes or href`,
      `${X + 3}: {latest.title} only works in a ?latest line`,
      `${X + 4}: {latest.href} only works in a ?latest line`,
    ])
  })

  it("checks /paths against the app's routes", () => {
    const source = withScene(
      "== extra\nLine.\n* A. -> /blog/some-post\n* B. -> /blog?topic=x\n* C. -> /nowhere\n* D. -> start"
    )
    expect(errors(source)).toEqual([`${X + 4}: no page for /nowhere under app/`])
    // An empty route list matches nothing; no list at all (the running app) skips the check
    expect(errors(source, [])).toHaveLength(7)
    const { fabula } = parseFabula(source)
    expect(validateFabula(fabula).filter((p) => p.severity === "error")).toEqual([])
  })

  it("keeps external links on the allowlist", () => {
    expect(
      errors(
        withScene(
          "== extra\nLine.\n* Off. -> https://example.com/sbozh\n* Sneaky. -> https://github.com/sbozhevil\n* Back. -> start"
        )
      )
    ).toEqual([
      `${X + 2}: https://example.com/sbozh is off the external allowlist (github.com/sbozh/)`,
      `${X + 3}: https://github.com/sbozhevil is off the external allowlist (github.com/sbozh/)`,
    ])
  })

  it("must reach the blog, forum, projects, subscribe, release notes and AVE", () => {
    const source = BASE.replace("* Forum. -> /forum\n", "").replace("* Releases. -> #releases", "* Back. -> start")
    expect(errors(source)).toEqual(["0: can't reach /forum, #releases from start"])
  })

  it("keeps the author's four openers", () => {
    // As written, glitch and all
    expect(
      errors(BASE.replace("* ==||What is AVE?|>Why color has changed?== -> ==ave|>color==", "* What is AVE? -> ==ave|>color=="))
    ).toEqual([
      '5: the openers are the author\'s: start offers "Hello.", "Where am I?", "...", "==||What is AVE?|>Why color has changed?==", in that order',
    ])
    const swapped = BASE.replace(
      "* Hello. -> hello\n* Where am I? -> where",
      "* Where am I? -> where\n* Hello. -> hello"
    )
    expect(errors(swapped)).toHaveLength(1)
    expect(errors(BASE.replace("* ... -> silence", "* ... -> #content"))).toEqual([
      expect.stringContaining("the openers are the author's"),
      '22: scene "silence" can\'t be reached from start',
    ])
  })

  it("checks glitch paths like any other, and warns when the label doesn't glitch", () => {
    expect(check(withScene("== extra\nLine.\n* Go. -> ==start|>nowhere==\n* ==Go.|>Run.== -> ==start|>/nowhere=="))).toEqual([
      {
        severity: "warning",
        line: X + 2,
        message: "this reply reads the same with the window ON: give its label a >state so the other path shows",
      },
      { severity: "error", line: X + 2, message: 'no scene "nowhere"' },
      { severity: "error", line: X + 3, message: "no page for /nowhere under app/" },
    ])
  })

  it("reaches scenes through glitch paths", () => {
    // `extra` is only reachable with the window ON
    expect(errors(withScene("== extra\nLine.\n* Back. -> start", "* ==More.|>Less.== -> ==where|>extra=="))).toEqual([])
  })

  it("measures lines as they read, glitch syntax aside", () => {
    const word = (n: number) => "x".repeat(n)
    // 150 characters either way: the markup doesn't count
    expect(check(withScene(`== extra\n${word(140)} ==${word(10)}|>${word(10)}==\n* Back. -> start`))).toEqual([])
    // ...but the longer reading does
    expect(check(withScene(`== extra\n${word(140)} ==a|>${word(30)}==\n* Back. -> start`))).toEqual([
      { severity: "warning", line: X + 1, message: "line is 171 characters: keep to 160 on a phone" },
    ])
  })

  it("warns about long lines and fails very long ones", () => {
    const line = (n: number) => "x".repeat(n)
    const problems = check(
      withScene(`== extra\n${line(170)}\n* Back. -> start\n?returning ${line(201)}\n* Back. -> start`)
    )
    expect(problems).toEqual([
      { severity: "warning", line: X + 1, message: "line is 170 characters: keep to 160 on a phone" },
      { severity: "error", line: X + 3, message: "line is 201 characters, over the 200 limit" },
    ])
  })

  it("fails long labels and a fifth reply", () => {
    const label = "y".repeat(49)
    expect(
      errors(
        withScene(`== extra\nLine.\n* ${label} -> start\n* 2. -> start\n* 3. -> start\n* 4. -> start\n* 5. -> start`)
      )
    ).toEqual([
      `${X + 2}: reply "${label}" is 49 characters, over the 48 limit`,
      `${X + 6}: more than 4 replies: keys 1–4 can't reach it`,
    ])
  })
})

describe("routes", () => {
  it("turns page files into route patterns", () => {
    expect(routeFromPageFile("page.tsx")).toBe("/")
    expect(routeFromPageFile("(main)/blog/[slug]/page.tsx")).toBe("/blog/[slug]")
    expect(routeFromPageFile("(main)\\forum\\page.tsx")).toBe("/forum")
    expect(routeFromPageFile("@modal/(main)/photo/page.mdx")).toBe("/photo")
    expect(routeFromPageFile("(main)/blog/layout.tsx")).toBeNull()
    expect(routeFromPageFile("rss.xml/route.ts")).toBeNull()
  })

  it("matches paths, with dynamic and catch-all segments", () => {
    const routes = ["/", "/blog/[slug]", "/docs/[...path]", "/shop/[[...rest]]"]
    expect(matchesRoute("/", routes)).toBe(true)
    expect(matchesRoute("/blog/hello", routes)).toBe(true)
    expect(matchesRoute("/blog/hello/", routes)).toBe(true)
    expect(matchesRoute("/blog/hello?x=1#top", routes)).toBe(true)
    expect(matchesRoute("/blog", routes)).toBe(false)
    expect(matchesRoute("/blog/a/b", routes)).toBe(false)
    expect(matchesRoute("/docs", routes)).toBe(false)
    expect(matchesRoute("/docs/a/b", routes)).toBe(true)
    expect(matchesRoute("/shop", routes)).toBe(true)
    expect(matchesRoute("/shop/a/b", routes)).toBe(true)
  })
})

describe("resolveScene", () => {
  const { fabula } = parseFabula(`@title Kagurame
== fresh
?returning Again.
* Back. -> fresh
?latest New: «{latest.title}». {latest.minutes} min.
* Read {latest.title}. -> {latest.href}
?latest New: «{latest.title}».
* Read it. -> {latest.href}
Nothing new.
* Back. -> fresh
== pool
~ One.
* Back. -> fresh
~ Two.
* Back. -> fresh
`)
  const post = { title: "Gladiators", slug: "gladiators", readingTime: 7 }

  it("says the first variant whose condition holds", () => {
    expect(resolveScene(fabula, "fresh", { returning: true, latestPost: post }).text).toBe("Again.")
    const latest = resolveScene(fabula, "fresh", { returning: false, latestPost: post })
    expect(latest).toEqual({
      scene: "fresh",
      variant: 1,
      text: "New: «Gladiators». 7 min.",
      choices: [{ label: "Read Gladiators.", target: { kind: "route", href: "/blog/gladiators" } }],
    })
  })

  it("skips a ?latest line whose placeholders have no value", () => {
    const line = resolveScene(fabula, "fresh", { returning: false, latestPost: { title: "Gladiators", slug: "g" } })
    expect(line.variant).toBe(2)
    expect(line.text).toBe("New: «Gladiators».")
  })

  it("falls back to the unmarked line", () => {
    expect(resolveScene(fabula, "fresh", { returning: false }).text).toBe("Nothing new.")
  })

  it("picks from the pool at random", () => {
    expect(resolveScene(fabula, "pool", { returning: false, random: () => 0 }).text).toBe("One.")
    expect(resolveScene(fabula, "pool", { returning: false, random: () => 0.99 }).text).toBe("Two.")
  })

  it("carries a reply's glitch path, placeholders filled", () => {
    const { fabula: paths } = parseFabula("== a\n?latest New.\n* ==Read.|>Run.== -> ==a|>{latest.href}==")
    expect(resolveScene(paths, "a", { returning: false, latestPost: post }).choices[0]).toEqual({
      label: "==Read.|>Run.==",
      target: { kind: "scene", scene: "a" },
      openTarget: { kind: "route", href: "/blog/gladiators" },
    })
  })

  it("throws on a scene that isn't there or has nothing to say", () => {
    expect(() => resolveScene(fabula, "nowhere", { returning: false })).toThrow(/no scene "nowhere"/)
    const { fabula: mute } = parseFabula("== a\n?returning Only then.\n* Go. -> a")
    expect(() => resolveScene(mute, "a", { returning: false })).toThrow(/nothing to say/)
  })
})

describe("readGlitch", () => {
  it("reads glitch words closed, or open with the window ON", () => {
    const text = "Still my 17th ==company|>legion==. ==||Bye.|>teal:I quit.== A (;) and ==a|b==."
    expect(readGlitch(text)).toBe("Still my 17th company. Bye. A ✳ and a.")
    expect(readGlitch(text, true)).toBe("Still my 17th legion. I quit. A ✳ and a.")
  })

  it("drops window-only words and the window switch when closed", () => {
    expect(readGlitch("Hi ==|there==.")).toBe("Hi .")
    expect(readGlitch("Hi ==|there==.", true)).toBe("Hi there.")
    expect(readGlitch("==WINDOW OFF== on")).toBe(" on")
    expect(readGlitch("a ==mark== b")).toBe("a mark b")
  })
})

describe("helpers", () => {
  it("fills placeholders and leaves the unknown ones", () => {
    expect(fillPlaceholders("{latest.title} / {latest.minutes} / {latest.nope}", { title: "T", slug: "t" })).toBe(
      "T / {latest.minutes} / {latest.nope}"
    )
  })

  it("splits the title into name and subtitle", () => {
    expect(splitTitle("Kagurame · ==a|b==")).toEqual({ name: "Kagurame", subtitle: "==a|b==" })
    expect(splitTitle("Kagurame")).toEqual({ name: "Kagurame", subtitle: "" })
  })
})
