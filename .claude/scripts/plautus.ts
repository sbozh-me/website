/**
 * Plautus's deterministic hands, the way ovidius-*.sh are Ovidius's. Run with Node 24 as is
 * (native type stripping, no tsx), from anywhere in the repo:
 *
 *   node .claude/scripts/plautus.ts check [--live]     validate the script; exit 1 on errors
 *   node .claude/scripts/plautus.ts graph [--open]     Mermaid flowchart; --open renders it in the browser
 *   node .claude/scripts/plautus.ts pending [--guids]  feed items not reviewed yet
 *   node .claude/scripts/plautus.ts mark <guid> written <scene> | skipped "<reason>" [--again]
 *
 * The script is apps/web/content/kagurame/onboarding.fabula, parsed by the app's own
 * apps/web/lib/kagurame/fabula.ts. The live feed (https://sbozh.me/rss.xml) is the source of
 * truth for what's new; the ledger (reviewed.tsv, committed) remembers what was reviewed.
 * No Directus, no tokens.
 */

import { spawnSync } from "node:child_process"
import { appendFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import type * as FabulaModule from "../../apps/web/lib/kagurame/fabula.ts"
import type { Fabula, Problem, Target } from "../../apps/web/lib/kagurame/fabula.ts"

// apps/web has no "type": "module" (Next doesn't need one), so Node says it re-parses
// fabula.ts as an ES module. Harmless: keep that one warning out of Plautus's output.
const printers = process.listeners("warning")
process.removeAllListeners("warning")
process.on("warning", (warning: Error & { code?: string }) => {
  if (warning.code !== "MODULE_TYPELESS_PACKAGE_JSON") for (const print of printers) print(warning)
})
const { parseFabula, readGlitch, routeFromPageFile, targetsOf, validateFabula }: typeof FabulaModule = await import(
  "../../apps/web/lib/kagurame/fabula.ts"
)

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const WEB = join(ROOT, "apps/web")
const SCRIPT = join(WEB, "content/kagurame/onboarding.fabula")
const LEDGER = join(WEB, "content/kagurame/reviewed.tsv")
const SITE = "https://sbozh.me"
const FEED = `${SITE}/rss.xml`
const USER_AGENT = "plautus (sbozh.me script check)"
// Pinned: the graph page must render the same way next year
const MERMAID = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"
const LEDGER_HEADER = "guid\treviewed\tverdict\tdetail\n"

/** Scenes Plautus writes and cuts: hubs and one scene per post or release. */
const PLAUTUS_SCENE = /^(archive|shipped|post-.+|release-.+)$/

const rel = (path: string) => relative(process.cwd(), path) || "."

// ---------------------------------------------------------------------------
// The script
// ---------------------------------------------------------------------------

function appRoutes(): string[] {
  return (readdirSync(join(WEB, "app"), { recursive: true }) as string[])
    .map(routeFromPageFile)
    .filter((route): route is string => route !== null)
}

function loadScript(): { fabula: Fabula; problems: Problem[] } {
  const { fabula, problems } = parseFabula(readFileSync(SCRIPT, "utf-8"))
  return { fabula, problems: [...problems, ...validateFabula(fabula, { routes: appRoutes() })] }
}

function printProblem({ severity, line, message }: Problem) {
  console.log(`${rel(SCRIPT)}${line ? `:${line}` : ""}: ${severity}: ${message}`)
}

async function check(live: boolean) {
  const { fabula, problems } = loadScript()
  problems.forEach(printProblem)
  if (live) {
    const found = await liveCheck(fabula)
    found.forEach(printProblem)
    problems.push(...found)
  }
  const errors = problems.filter((p) => p.severity === "error").length
  const warnings = problems.length - errors
  const summary = `${fabula.scenes.length} scenes, ${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}`
  console.log(errors ? `✗ ${summary}` : `✓ ${summary}${live ? ", every link answers on sbozh.me" : ""}`)
  process.exitCode = errors ? 1 : 0
}

/** Every /path and external link in the script must answer on the live site. */
async function liveCheck(fabula: Fabula): Promise<Problem[]> {
  const urls = new Map<string, number>()
  for (const scene of fabula.scenes) {
    for (const variant of scene.variants) {
      for (const choice of variant.choices) {
        for (const target of targetsOf(choice)) {
          const url = target.kind === "route" && !target.href.includes("{") ? `${SITE}${target.href}` : target.kind === "external" ? target.href : null
          if (url && !urls.has(url)) urls.set(url, choice.line)
        }
      }
    }
  }
  const results = await Promise.all(
    [...urls].map(async ([url, line]): Promise<Problem | null> => {
      try {
        const response = await fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT } })
        return response.ok ? null : { severity: "error", line, message: `${url} answered ${response.status}` }
      } catch (error) {
        return { severity: "error", line, message: `${url} didn't answer: ${(error as Error).message}` }
      }
    })
  )
  return results.filter((p): p is Problem => p !== null)
}

// ---------------------------------------------------------------------------
// The graph
// ---------------------------------------------------------------------------

const VARIANT_MARK: Record<string, string> = { default: "", random: "~", returning: "?returning", latest: "?latest" }

/** Text for inside a quoted Mermaid label. */
function label(text: string): string {
  return text.replace(/"/g, "#quot;").replace(/</g, "#lt;").replace(/>/g, "#gt;")
}

function snippet(text: string, max = 44): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

export function mermaid(fabula: Fabula): string {
  const declared: string[] = []
  const ids = new Map<string, string>()
  const node = (key: string, shape: (id: string) => string) => {
    if (!ids.has(key)) {
      const id = `n${ids.size}`
      ids.set(key, id)
      declared.push(`  ${shape(id)}`)
    }
    return ids.get(key)!
  }

  for (const scene of fabula.scenes) {
    const first = scene.variants.find((v) => v.kind === "default") ?? scene.variants[0]
    const kind = scene.id === "start" ? "start" : PLAUTUS_SCENE.test(scene.id) ? "plautus" : "scene"
    node(`scene:${scene.id}`, (id) => `${id}["<b>${label(scene.id)}</b><br/><i>${label(snippet(readGlitch(first?.text ?? "")))}</i>"]:::${kind}`)
  }

  const targetNode = (target: Target) => {
    if (target.kind === "scene") return ids.get(`scene:${target.scene}`) ?? node(`missing:${target.scene}`, (id) => `${id}["${label(target.scene)} ✗"]:::missing`)
    if (target.kind === "route") return node(`route:${target.href}`, (id) => `${id}(["${label(target.href)}"]):::route`)
    if (target.kind === "external") return node(`external:${target.href}`, (id) => `${id}{{"${label(target.href.replace("https://", ""))}"}}:::external`)
    if (target.kind === "scroll") return node(`scroll:${target.to}`, (id) => `${id}(("#${target.to}")):::scroll`)
    return node("close", (id) => `${id}((("close"))):::close`)
  }

  // One edge per (scene, target, reply), solid if the unmarked line offers it, else dashed with
  // its markers; a reply's window-ON path is a thick edge, labelled the way it reads then
  const edges = new Map<string, { from: string; to: string; text: string; marks: Set<string>; open: boolean }>()
  const addEdge = (from: string, to: string, text: string, mark: string, open: boolean) => {
    const key = `${from}>${to}>${text}>${open}`
    const edge = edges.get(key) ?? { from, to, text, marks: new Set<string>(), open }
    edge.marks.add(mark)
    edges.set(key, edge)
  }
  for (const scene of fabula.scenes) {
    const from = ids.get(`scene:${scene.id}`)!
    for (const variant of scene.variants) {
      for (const choice of variant.choices) {
        const mark = VARIANT_MARK[variant.kind]
        addEdge(from, targetNode(choice.target), readGlitch(choice.label), mark, false)
        if (choice.openTarget) addEdge(from, targetNode(choice.openTarget), readGlitch(choice.label, true), mark, true)
      }
    }
  }

  const lines = [...edges.values()].map(({ from, to, text, marks, open }) => {
    const conditions = [...marks].filter(Boolean).join(" ")
    if (open) return `  ${from} ==>|"${label(`⊞ ${marks.has("") ? "" : conditions + " "}${text}`)}"| ${to}`
    if (marks.has("")) return `  ${from} -->|"${label(text)}"| ${to}`
    return `  ${from} -.->|"${label(`${conditions} ${text}`)}"| ${to}`
  })

  return [
    "flowchart LR",
    ...declared,
    ...lines,
    "  classDef scene fill:#16161f,stroke:#8b5cf6,color:#e7e5f4",
    "  classDef start fill:#2a1f4a,stroke:#f59e0b,stroke-width:2px,color:#ffffff",
    "  classDef plautus fill:#16161f,stroke:#8b5cf6,stroke-dasharray:5 4,color:#e7e5f4",
    "  classDef route fill:#0f2418,stroke:#22c55e,color:#d1fae5",
    "  classDef external fill:#2a1f0a,stroke:#f59e0b,color:#fde68a",
    "  classDef scroll fill:#1e1b4b,stroke:#a78bfa,color:#ede9fe",
    "  classDef close fill:#262626,stroke:#737373,color:#d4d4d4",
    "  classDef missing fill:#3f0d0d,stroke:#ef4444,color:#fecaca",
  ].join("\n")
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function graphPage(fabula: Fabula, source: string, problems: Problem[]): string {
  const errors = problems.filter((p) => p.severity === "error").length
  const status = errors ? `${errors} error${errors === 1 ? "" : "s"}: run check` : "check passes"
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kagurame's script</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0a0a0f; color: #e7e5f4; font: 14px/1.5 ui-monospace, "JetBrains Mono", Menlo, monospace; }
  header { padding: 16px 24px; border-bottom: 1px solid #26263a; }
  h1 { margin: 0; font-size: 18px; color: #f59e0b; }
  p { margin: 4px 0 0; color: #a1a1b5; }
  .legend span { margin-right: 16px; white-space: nowrap; }
  main { padding: 24px; overflow: auto; }
  .mermaid { min-width: max-content; }
</style>
</head>
<body>
<header>
  <h1>Kagurame's script</h1>
  <p>${escapeHtml(rel(SCRIPT))} · ${fabula.scenes.length} scenes · ${status} · ${new Date().toISOString().slice(0, 16).replace("T", " ")}</p>
  <p class="legend"><span>▭ scene (dashed: Plautus's)</span><span>⬭ route</span><span>⬡ external, new tab</span><span>○ scroll</span><span>◎ close</span><span>- - → ?condition or ~ pool</span><span>━━▶ ⊞ window ON path</span></p>
</header>
<main><pre class="mermaid">${escapeHtml(source)}</pre></main>
<script type="module">
  import mermaid from "${MERMAID}"
  mermaid.initialize({ startOnLoad: true, theme: "dark", securityLevel: "strict", flowchart: { curve: "basis", htmlLabels: true } })
</script>
</body>
</html>
`
}

function graph(open: boolean) {
  const { fabula, problems } = loadScript()
  const source = mermaid(fabula)
  if (!open) {
    console.log(source)
    return
  }
  const file = join(mkdtempSync(join(tmpdir(), "plautus-")), "kagurame-graph.html")
  writeFileSync(file, graphPage(fabula, source, problems))
  console.log(file)
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open"
  spawnSync(opener, [file], { stdio: "ignore" })
}

// ---------------------------------------------------------------------------
// The feed and the ledger
// ---------------------------------------------------------------------------

interface FeedItem {
  guid: string
  title: string
  link: string
  date: string
  kind: string
}

function decodeXml(text: string): string {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

const KINDS: Record<string, string> = { "Blog posts": "post", "Release notes": "release" }

async function readFeed(): Promise<FeedItem[]> {
  const response = await fetch(FEED, { headers: { "user-agent": USER_AGENT } })
  if (!response.ok) throw new Error(`${FEED} answered ${response.status}`)
  const xml = await response.text()
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g), ([, item]) => {
    const tag = (name: string) => decodeXml(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(item)?.[1]?.trim() ?? "")
    const link = tag("link")
    const category = tag("category")
    const date = new Date(tag("pubDate"))
    return {
      guid: tag("guid") || link,
      title: tag("title"),
      link,
      date: Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10),
      kind: KINDS[category] ?? (category.toLowerCase() || "item"),
    }
  })
}

interface LedgerRow {
  guid: string
  reviewed: string
  verdict: string
  detail: string
}

function readLedger(): Map<string, LedgerRow> {
  const rows = new Map<string, LedgerRow>()
  if (!existsSync(LEDGER)) return rows
  for (const line of readFileSync(LEDGER, "utf-8").split("\n").slice(1)) {
    if (!line.trim()) continue
    const [guid, reviewed, verdict, detail] = line.split("\t")
    rows.set(guid, { guid, reviewed, verdict, detail })
  }
  return rows
}

async function pending(guidsOnly: boolean) {
  const [items, ledger] = [await readFeed(), readLedger()]
  const fresh = items.filter((item) => !ledger.has(item.guid))
  if (guidsOnly) {
    fresh.forEach((item) => console.log(item.guid))
    return
  }
  console.log(`${fresh.length} pending of ${items.length} in ${FEED} (${items.length - fresh.length} reviewed)`)
  for (const item of fresh) {
    console.log(`\n${item.kind.padEnd(8)} ${item.date}  ${item.title}\n${" ".repeat(20)}${item.guid}`)
  }
}

function mark(args: string[]) {
  const again = args.includes("--again")
  const [guid, verdict, ...rest] = args.filter((arg) => arg !== "--again")
  const detail = rest.join(" ").trim()
  const usage = 'usage: mark <guid> written <scene> | mark <guid> skipped "<reason>" [--again]'
  if (!guid || !detail || (verdict !== "written" && verdict !== "skipped")) fail(usage)
  if (/[\t\n]/.test(guid + detail)) fail("no tabs or newlines in a guid or a reason")
  if (verdict === "written") {
    const { fabula } = parseFabula(readFileSync(SCRIPT, "utf-8"))
    if (!fabula.scenes.some((scene) => scene.id === detail)) fail(`no scene "${detail}" in ${rel(SCRIPT)}: write it first`)
  }
  const previous = readLedger().get(guid)
  if (previous && !again) {
    fail(`${guid} was reviewed on ${previous.reviewed} (${previous.verdict}: ${previous.detail}); pass --again to review it anew`)
  }
  if (!existsSync(LEDGER)) writeFileSync(LEDGER, LEDGER_HEADER)
  const today = new Date().toISOString().slice(0, 10)
  appendFileSync(LEDGER, `${guid}\t${today}\t${verdict}\t${detail}\n`)
  console.log(`✓ ${verdict}: ${guid} → ${detail}`)
}

// ---------------------------------------------------------------------------

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

const HELP = `Plautus: Kagurame's script (${rel(SCRIPT)})

  check [--live]     validate the script, problems with line numbers; exit 1 on errors
                     --live also checks every /path and external link on ${SITE}
  graph [--open]     Mermaid flowchart of the scenes; --open renders it in the browser
  pending [--guids]  items in ${FEED} not in the ledger yet
  mark <guid> written <scene>          record a review in ${rel(LEDGER)}
  mark <guid> skipped "<reason>"       (--again to review an item anew)`

const [command, ...args] = process.argv.slice(2)
switch (command) {
  case "check":
    await check(args.includes("--live"))
    break
  case "graph":
    graph(args.includes("--open"))
    break
  case "pending":
    await pending(args.includes("--guids"))
    break
  case "mark":
    mark(args)
    break
  case undefined:
  case "help":
  case "--help":
  case "-h":
    console.log(HELP)
    break
  default:
    fail(`unknown command "${command}"\n\n${HELP}`)
}
