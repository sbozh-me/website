/**
 * Fabula: the script format behind Kagurame's dialogue on the home page
 * (`content/kagurame/onboarding.fabula`). Line-based, so it reads like a play and diffs
 * like one:
 *
 *   # a comment
 *   @title Kagurame · ==||17th Company|purple:17th Dimension|red:17th Legion==
 *
 *   == scene-id
 *   ?returning A line for a visitor who came back.
 *   * A reply. -> another-scene
 *   ?latest The freshest scroll: «{latest.title}».
 *   * Read it. -> {latest.href}
 *   ~ One line of a random pool.
 *   * Go. -> /blog
 *   The unmarked line: what he says otherwise.
 *   * Back. -> start
 *
 * Lines, reply labels and the title may use the blog's glitch syntax (`==a|>b==`, `teal:`, `(;)`).
 *
 * A scene is one or more variants: a line, then its replies. Conditions (`?returning`,
 * `?latest`) are tried in order and the first that holds wins; otherwise one `~` line is
 * picked at random, or the unmarked line is said. A `?latest` variant holds only when the
 * latest post has a value for every `{latest.*}` placeholder the variant uses.
 *
 * Reply targets: a scene id, `/path`, `https://…` (new tab), `#content` / `#releases`
 * (scroll), `!close`. A line that starts with a marker character is escaped with `\`.
 *
 * One module, no imports, erasable TypeScript only (no enums, namespaces or parameter
 * properties): the app imports it, and Node runs it as is from `.claude/scripts/plautus.ts`.
 */

export type Condition = "returning" | "latest"
export type VariantKind = Condition | "random" | "default"
export type ScrollTarget = "content" | "releases"

export type Target =
  | { kind: "scene"; scene: string }
  | { kind: "route"; href: string }
  | { kind: "external"; href: string }
  | { kind: "scroll"; to: ScrollTarget }
  | { kind: "close" }

export interface Choice {
  label: string
  target: Target
  line: number
}

export interface Variant {
  kind: VariantKind
  text: string
  choices: Choice[]
  line: number
}

export interface Scene {
  id: string
  variants: Variant[]
  line: number
}

export interface Fabula {
  /** `@title`: "Name · subtitle", the subtitle may use the glitch syntax */
  title: string
  titleLine: number
  scenes: Scene[]
}

export interface Problem {
  severity: "error" | "warning"
  /** 1-based; 0 is the script as a whole */
  line: number
  message: string
}

export interface LatestPost {
  title: string
  slug: string
  readingTime?: number
}

export interface SceneContext {
  /** Has this visitor talked to Kagurame before */
  returning: boolean
  latestPost?: LatestPost
  /** Injected so tests can pin the random pool */
  random?: () => number
}

export interface ResolvedChoice {
  label: string
  target: Target
}

export interface ResolvedScene {
  scene: string
  /** Index of the variant said, for `lineKey` */
  variant: number
  text: string
  choices: ResolvedChoice[]
}

export interface ValidateOptions {
  /**
   * Route patterns from `app/**\/page.tsx` (see `routeFromPageFile`). Without them `/paths`
   * aren't checked: the running app has no source tree to read.
   */
  routes?: string[]
}

/**
 * The openers are the author's: every variant of `start` offers exactly these, as written.
 * With the window ON the fourth one turns into "Why color has changed?".
 */
export const OPENERS: readonly { label: string; scene: string }[] = [
  { label: "Hello.", scene: "hello" },
  { label: "Where am I?", scene: "where" },
  { label: "...", scene: "silence" },
  { label: "==||What is AVE?|>Why color has changed?==", scene: "ave" },
]

/** Every visitor must be able to reach these from `start`: routes, scrolls and scenes. */
export const MUST_REACH: readonly string[] = ["/blog", "/forum", "/projects", "/subscribe", "#releases", "ave"]

/** External links may only go here (host and path prefix, after `https://`). */
export const EXTERNAL_ALLOWLIST: readonly string[] = ["github.com/sbozh/"]

export const LIMITS = {
  /** Characters in a line: above `lineSoft` warns, above `line` fails */
  line: 200,
  lineSoft: 160,
  label: 48,
  /** Replies per line: keys 1–4 */
  choices: 4,
} as const

export const PLACEHOLDER_NAMES: readonly string[] = ["title", "minutes", "href"]

const SCENE_ID = /^[a-z][a-z0-9-]*$/
const PLACEHOLDER = /\{latest\.([A-Za-z]+)\}/g
const CONDITIONS: readonly string[] = ["returning", "latest"]

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseFabula(source: string): { fabula: Fabula; problems: Problem[] } {
  const fabula: Fabula = { title: "", titleLine: 0, scenes: [] }
  const problems: Problem[] = []
  const error = (line: number, message: string) => problems.push({ severity: "error", line, message })
  let scene: Scene | undefined
  let variant: Variant | undefined

  source.split(/\r?\n/).forEach((raw, index) => {
    const n = index + 1
    const line = raw.trim()
    if (!line || line.startsWith("#")) return

    if (line.startsWith("@")) {
      const [directive] = line.split(/\s/, 1)
      const value = line.slice(directive.length).trim()
      if (directive !== "@title") error(n, `unknown directive ${directive}: only @title exists`)
      else if (!value) error(n, "@title is empty")
      else if (fabula.title) error(n, `@title is already set on line ${fabula.titleLine}`)
      else {
        fabula.title = value
        fabula.titleLine = n
      }
      return
    }

    if (line.startsWith("==")) {
      const id = line.slice(2).trim()
      variant = undefined
      scene = undefined
      if (!SCENE_ID.test(id)) {
        error(n, `scene id "${id}" must be lowercase letters, digits and dashes, starting with a letter`)
        return
      }
      const twin = fabula.scenes.find((s) => s.id === id)
      if (twin) error(n, `scene "${id}" is already defined on line ${twin.line}`)
      scene = { id, variants: [], line: n }
      fabula.scenes.push(scene)
      return
    }

    if (line.startsWith("*")) {
      if (!variant) {
        error(n, "a reply needs a line above it")
        return
      }
      const body = line.slice(1)
      const arrow = body.lastIndexOf("->")
      if (arrow < 0) {
        error(n, "a reply needs a target: * label -> target")
        return
      }
      const label = body.slice(0, arrow).trim()
      const target = parseTarget(body.slice(arrow + 2).trim())
      if (!label) error(n, "a reply needs a label")
      else if (typeof target === "string") error(n, target)
      else variant.choices.push({ label, target, line: n })
      return
    }

    if (!scene) {
      error(n, "a line outside a scene: start one with == id")
      return
    }
    let kind: VariantKind = "default"
    let text = line
    if (line.startsWith("?")) {
      const [marker] = line.split(/\s/, 1)
      const condition = marker.slice(1)
      if (!CONDITIONS.includes(condition)) {
        error(n, `unknown condition ${marker}: use ?returning or ?latest`)
        return
      }
      kind = condition as Condition
      text = line.slice(marker.length).trim()
    } else if (line.startsWith("~")) {
      kind = "random"
      text = line.slice(1).trim()
    } else if (line.startsWith("\\")) {
      text = line.slice(1)
    }
    if (!text) {
      error(n, "a line with a marker but nothing to say")
      return
    }
    variant = { kind, text, choices: [], line: n }
    scene.variants.push(variant)
  })

  return { fabula, problems }
}

/** A reply's target, or why it isn't one. */
export function parseTarget(raw: string): Target | string {
  if (!raw) return "a reply needs a target after ->"
  if (/\s/.test(raw)) return `target "${raw}" has a space in it`
  if (raw === "!close") return { kind: "close" }
  if (raw === "#content" || raw === "#releases") return { kind: "scroll", to: raw.slice(1) as ScrollTarget }
  if (raw.startsWith("https://")) return { kind: "external", href: raw }
  if (raw.startsWith("/") || raw === "{latest.href}") return { kind: "route", href: raw }
  if (SCENE_ID.test(raw)) return { kind: "scene", scene: raw }
  if (raw.startsWith("http://")) return `external link "${raw}" must use https://`
  if (raw.startsWith("!")) return `unknown command "${raw}": only !close exists`
  if (raw.startsWith("#")) return `unknown scroll "${raw}": use #content or #releases`
  return `"${raw}" is not a scene id, /path, https:// link, #content, #releases or !close`
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function findScene(fabula: Fabula, id: string): Scene | undefined {
  return fabula.scenes.find((scene) => scene.id === id)
}

export function validateFabula(fabula: Fabula, options: ValidateOptions = {}): Problem[] {
  const problems: Problem[] = []
  const error = (line: number, message: string) => problems.push({ severity: "error", line, message })
  const warn = (line: number, message: string) => problems.push({ severity: "warning", line, message })

  if (!fabula.title) error(0, "no @title: the dialogue box needs one")
  const start = findScene(fabula, "start")
  if (!start) error(0, 'no "start" scene: Kagurame has nowhere to begin')

  for (const scene of fabula.scenes) {
    const { id } = scene
    if (scene.variants.length === 0) {
      error(scene.line, `scene "${id}" says nothing`)
      continue
    }
    const defaults = scene.variants.filter((v) => v.kind === "default")
    const pool = scene.variants.filter((v) => v.kind === "random")
    if (defaults.length > 1) error(defaults[1].line, `scene "${id}" has a second unmarked line: only the first is ever said`)
    if (defaults.length > 0 && pool.length > 0) error(pool[0].line, `scene "${id}" mixes a ~ pool with an unmarked line: pick one`)
    if (defaults.length === 0 && pool.length === 0) {
      error(scene.line, `scene "${id}" has nothing to say when no condition holds: add an unmarked or ~ line`)
    }

    for (const variant of scene.variants) {
      const length = variant.text.length
      if (length > LIMITS.line) error(variant.line, `line is ${length} characters, over the ${LIMITS.line} limit`)
      else if (length > LIMITS.lineSoft) warn(variant.line, `line is ${length} characters: keep to ${LIMITS.lineSoft} on a phone`)
      if (variant.choices.length === 0) error(variant.line, `dead end in "${id}": a line needs at least one reply`)
      if (variant.choices.length > LIMITS.choices) {
        error(variant.choices[LIMITS.choices].line, `more than ${LIMITS.choices} replies: keys 1–${LIMITS.choices} can't reach it`)
      }
      checkPlaceholders(variant.text, variant, variant.line, error)

      for (const choice of variant.choices) {
        const { label, target, line } = choice
        if (label.length > LIMITS.label) error(line, `reply "${label}" is ${label.length} characters, over the ${LIMITS.label} limit`)
        checkPlaceholders(label, variant, line, error)
        if (target.kind === "scene" && !findScene(fabula, target.scene)) {
          error(line, `no scene "${target.scene}"`)
        } else if (target.kind === "route") {
          checkPlaceholders(target.href, variant, line, error)
          const placeholder = target.href.includes("{")
          if (!placeholder && options.routes && !matchesRoute(target.href, options.routes)) {
            error(line, `no page for ${target.href} under app/`)
          }
        } else if (target.kind === "external" && !EXTERNAL_ALLOWLIST.some((prefix) => target.href.slice(8).startsWith(prefix))) {
          error(line, `${target.href} is off the external allowlist (${EXTERNAL_ALLOWLIST.join(", ")})`)
        }
      }
    }
  }

  if (start) {
    const reached = reachableScenes(fabula)
    for (const scene of fabula.scenes) {
      if (!reached.has(scene.id)) error(scene.line, `scene "${scene.id}" can't be reached from start`)
    }
    const destinations = new Set<string>(reached)
    for (const id of reached) {
      for (const variant of findScene(fabula, id)?.variants ?? []) {
        for (const { target } of variant.choices) {
          if (target.kind === "route") destinations.add(stripQuery(target.href))
          if (target.kind === "scroll") destinations.add(`#${target.to}`)
        }
      }
    }
    const missing = MUST_REACH.filter((place) => !destinations.has(place))
    if (missing.length) error(0, `can't reach ${missing.join(", ")} from start`)

    for (const variant of start.variants) {
      const offered = variant.choices.map(({ label, target }) => `${label} -> ${target.kind === "scene" ? target.scene : "…"}`)
      const expected = OPENERS.map(({ label, scene }) => `${label} -> ${scene}`)
      if (offered.join("\n") !== expected.join("\n")) {
        error(variant.line, `the openers are the author's: start offers ${OPENERS.map((o) => `"${o.label}"`).join(", ")}, in that order`)
      }
    }
  }

  return problems.sort((a, b) => a.line - b.line)
}

/** Scene ids reachable from `start` through any variant. */
export function reachableScenes(fabula: Fabula): Set<string> {
  const reached = new Set<string>()
  const queue = ["start"]
  while (queue.length) {
    const id = queue.shift()!
    const scene = findScene(fabula, id)
    if (!scene || reached.has(id)) continue
    reached.add(id)
    for (const variant of scene.variants) {
      for (const { target } of variant.choices) {
        if (target.kind === "scene") queue.push(target.scene)
      }
    }
  }
  return reached
}

function checkPlaceholders(
  text: string,
  variant: Variant,
  line: number,
  error: (line: number, message: string) => void
) {
  for (const name of placeholdersIn(text)) {
    if (!PLACEHOLDER_NAMES.includes(name)) error(line, `unknown placeholder {latest.${name}}: use title, minutes or href`)
    else if (variant.kind !== "latest") error(line, `{latest.${name}} only works in a ?latest line`)
  }
}

export function placeholdersIn(text: string): string[] {
  return Array.from(text.matchAll(PLACEHOLDER), (match) => match[1])
}

function stripQuery(href: string): string {
  return href.split(/[?#]/)[0].replace(/(.)\/+$/, "$1")
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * A page file under `app/` (relative to it) as a route pattern:
 * `(main)/blog/[slug]/page.tsx` → `/blog/[slug]`. Route groups and parallel slots drop out.
 * Anything that isn't a page file gives null.
 */
export function routeFromPageFile(relative: string): string | null {
  const parts = relative.replace(/\\/g, "/").split("/").filter(Boolean)
  const file = parts.pop()
  if (!file || !/^page\.(tsx|ts|jsx|js|mdx)$/.test(file)) return null
  const segments = parts.filter((part) => !(part.startsWith("(") && part.endsWith(")")) && !part.startsWith("@"))
  return `/${segments.join("/")}`
}

/** Does `/path` hit one of the route patterns? Dynamic segments match any slug. */
export function matchesRoute(path: string, routes: readonly string[]): boolean {
  const parts = stripQuery(path).split("/").filter(Boolean)
  return routes.some((route) => matchSegments(parts, route.split("/").filter(Boolean)))
}

function matchSegments(parts: string[], pattern: string[]): boolean {
  for (let i = 0; i < pattern.length; i++) {
    const segment = pattern[i]
    // [[...slug]]: zero or more; [...slug]: one or more
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) return true
    if (/^\[\.\.\..+\]$/.test(segment)) return parts.length > i
    if (i >= parts.length) return false
    if (/^\[.+\]$/.test(segment)) continue
    if (segment !== parts[i]) return false
  }
  return parts.length === pattern.length
}

// ---------------------------------------------------------------------------
// Resolving
// ---------------------------------------------------------------------------

function placeholderValues(post?: LatestPost): Record<string, string | undefined> {
  return {
    title: post?.title,
    minutes: post?.readingTime ? String(post.readingTime) : undefined,
    href: post ? `/blog/${post.slug}` : undefined,
  }
}

/** `{latest.*}` filled in from the latest post; unknown or missing ones stay as written. */
export function fillPlaceholders(text: string, post?: LatestPost): string {
  const values = placeholderValues(post)
  return text.replace(PLACEHOLDER, (whole, name: string) => values[name] ?? whole)
}

function variantPlaceholders(variant: Variant): string[] {
  const texts = [variant.text]
  for (const { label, target } of variant.choices) {
    texts.push(label)
    if (target.kind === "route") texts.push(target.href)
  }
  return texts.flatMap(placeholdersIn)
}

export function variantHolds(variant: Variant, ctx: SceneContext): boolean {
  if (variant.kind === "returning") return ctx.returning
  if (variant.kind !== "latest" || !ctx.latestPost) return false
  const values = placeholderValues(ctx.latestPost)
  return variantPlaceholders(variant).every((name) => values[name] !== undefined)
}

/** Which variant of the scene he says: the first condition that holds, else the pool or the unmarked line. */
export function pickVariant(scene: Scene, ctx: SceneContext): number {
  const conditional = scene.variants.findIndex((v) => v.kind !== "default" && v.kind !== "random" && variantHolds(v, ctx))
  if (conditional >= 0) return conditional
  const pool = scene.variants.flatMap((v, index) => (v.kind === "random" ? [index] : []))
  if (pool.length) return pool[Math.floor((ctx.random ?? Math.random)() * pool.length) % pool.length]
  return scene.variants.findIndex((v) => v.kind === "default")
}

/** What Kagurame says in a scene, with the latest post filled in. Pick once per visit to the scene. */
export function resolveScene(fabula: Fabula, id: string, ctx: SceneContext): ResolvedScene {
  const scene = findScene(fabula, id)
  if (!scene) throw new Error(`Kagurame has no scene "${id}"`)
  const index = pickVariant(scene, ctx)
  if (index < 0) throw new Error(`Kagurame has nothing to say in scene "${id}"`)
  const variant = scene.variants[index]
  const post = ctx.latestPost
  return {
    scene: id,
    variant: index,
    text: fillPlaceholders(variant.text, post),
    choices: variant.choices.map(({ label, target }) => ({
      label: fillPlaceholders(label, post),
      target: target.kind === "route" ? { kind: "route", href: fillPlaceholders(target.href, post) } : target,
    })),
  }
}

/** Key of one variant's line, for lines compiled on the server. */
export function lineKey(scene: string, variant: number): string {
  return `${scene}:${variant}`
}

/** Key of one reply's label, for labels compiled on the server. */
export function choiceKey(scene: string, variant: number, choice: number): string {
  return `${scene}:${variant}:${choice}`
}

/** `@title` "Kagurame · subtitle" as its name and subtitle. */
export function splitTitle(title: string): { name: string; subtitle: string } {
  const at = title.indexOf(" · ")
  return at < 0 ? { name: title, subtitle: "" } : { name: title.slice(0, at), subtitle: title.slice(at + 3) }
}
