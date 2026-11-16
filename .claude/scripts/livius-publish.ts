/**
 * Livius's deterministic hands, the way plautus.ts is Plautus's: they put a drafted release note
 * on the site. Livius writes release-notes/<version>.md; this posts it to the production Directus
 * `release_notes` collection. Run with Node 24 as is, from anywhere in the repo:
 *
 *   node .claude/scripts/livius-publish.ts check <version>             validate the draft; last line is its slug
 *   node .claude/scripts/livius-publish.ts post <version> [--dry-run]  create or update the note, mail off
 *   node .claude/scripts/livius-publish.ts mail <version> [--dry-run]  turn the subscriber mail on
 *   node .claude/scripts/livius-publish.ts status <version>            what production holds for it
 *
 * /commit push calls `post` right after the tag is pushed: the release page is dynamic, so the
 * note is live at once and Kagurame's link to it answers. /commit deploy calls `mail` once the
 * server runs the version, so nobody is mailed about something that isn't live.
 *
 * Writes go through the server: the token lives in its .env (apps/web/.env.local points at local
 * Directus, which lags production). The token never leaves the server and is never printed.
 */

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const NOTES = join(ROOT, "release-notes")
const SITE = "https://sbozh.me"
const HOST = "sbozhme"
const APP_DIR = "/opt/sbozh-me"
const TYPES = ["feature", "fix", "breaking", "maintenance"]
/** The projects a note can belong to: name in the draft → Directus id and the slug in its URL */
const PROJECTS: Record<string, { id: string; slug: string }> = {
  "sbozh.me": { id: "0c8fe541-aaf3-4669-a523-26bce5fa8b36", slug: "sbozh-me" },
}
const FIELDS = "id,version,slug,status,date_released,notify_subscribers,announced_at"
/** Mirrors MAX_AGE_MS in apps/web/lib/announcements/service.ts: an older note is marked announced without mail */
export const MAX_MAIL_AGE_MS = 3 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// The draft
// ---------------------------------------------------------------------------

export interface Note {
  title: string
  slug: string
  version: string
  type: string
  /** YYYY-MM-DD, as Livius stamped it */
  date: string
  project: string
  /** Markdown from the first `## ` section on */
  summary: string
}

/** Reads Livius's format: a `| field | value |` table, a `---` line, then the summary. */
export function parseNote(markdown: string): Note {
  const lines = markdown.split("\n")
  const rule = lines.findIndex((line) => line.trim() === "---")
  if (rule === -1) throw new Error("no `---` line between the table and the summary")

  const fields = new Map<string, string>()
  for (const line of lines.slice(0, rule)) {
    const row = /^\|\s*([a-z_]+)\s*\|\s*(.*?)\s*\|\s*$/.exec(line)
    if (row) fields.set(row[1], row[2])
  }
  const body = lines.slice(rule + 1)
  const first = body.findIndex((line) => line.startsWith("## "))
  const note: Note = {
    title: fields.get("title") ?? "",
    slug: fields.get("slug") ?? "",
    version: fields.get("version") ?? "",
    type: fields.get("type") ?? "",
    date: fields.get("date_released") ?? "",
    project: fields.get("project") ?? "",
    summary: first === -1 ? "" : body.slice(first).join("\n").trim(),
  }

  const problems: string[] = []
  if (!note.title) problems.push("title is empty")
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(note.slug)) problems.push(`slug "${note.slug}" is not lowercase kebab-case`)
  if (!/^\d+\.\d+\.\d+$/.test(note.version)) problems.push(`version "${note.version}" is not x.y.z`)
  if (!TYPES.includes(note.type)) problems.push(`type "${note.type}" is not one of ${TYPES.join(", ")}`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date)) problems.push(`date_released "${note.date}" is not YYYY-MM-DD`)
  if (!PROJECTS[note.project]) problems.push(`project "${note.project}" is unknown (known: ${Object.keys(PROJECTS).join(", ")})`)
  if (!note.summary) problems.push("the summary has no `## ` section")
  if (problems.length) throw new Error(problems.join("; "))
  return note
}

export function releaseUrl(note: Pick<Note, "project" | "slug">): string {
  return `${SITE}/projects/${PROJECTS[note.project].slug}/releases/${note.slug}`
}

/**
 * `date_released` is a naive datetime that Directus reads as UTC, and the mail goes out once it
 * is in the past. A note drafted today is stamped with the posting time in UTC (CET would mail an
 * hour late); an older draft keeps its own day.
 */
export function stampDate(date: string, now: Date): string {
  const utc = now.toISOString()
  const pad = (n: number) => String(n).padStart(2, "0")
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return date === utc.slice(0, 10) || date === local ? utc.slice(0, 19) : `${date}T12:00:00`
}

/** What a new note is created with. The draft's `media` row has no Directus field. */
export function createPayload(note: Note, now: Date) {
  return {
    title: note.title,
    slug: note.slug,
    version: `v${note.version}`,
    type: note.type,
    status: "published",
    project: PROJECTS[note.project].id,
    date_released: stampDate(note.date, now),
    summary: note.summary,
    // The mail is /commit deploy's call. announced_at is the "already sent" marker: never set here
    notify_subscribers: false,
  }
}

/** A re-run rewrites the text and leaves the date and both mail fields as they are. */
export function updatePayload(note: Note) {
  const { title, slug, type, status, project, summary } = createPayload(note, new Date(0))
  return { title, slug, type, status, project, summary }
}

// ---------------------------------------------------------------------------
// Production
// ---------------------------------------------------------------------------

export interface Remote {
  id: string
  version: string
  slug: string
  status: string
  date_released: string
  notify_subscribers: boolean
  announced_at: string | null
}

export type Directus = (method: "GET" | "POST" | "PATCH", path: string, body?: unknown) => unknown

export interface Deps {
  directus: Directus
  /** HTTP status of a page on the live site */
  pageStatus: (url: string) => Promise<number>
  log: (line: string) => void
  now: () => Date
  sleep: (ms: number) => Promise<void>
}

/** Calls production Directus from the server, where the token is. */
const directusOverSsh: Directus = (method, path, body) => {
  // Everything that reaches the remote shell is checked first: versions, slugs and ids only
  if (!/^[A-Za-z0-9_\-./?=&[\],]+$/.test(path)) throw new Error(`refusing an unexpected Directus path: ${path}`)
  const remote = [
    `cd ${APP_DIR} && set -a && . ./.env && set +a &&`,
    `curl -sS -g --max-time 30 -X ${method}`,
    `-H "Authorization: Bearer $DIRECTUS_TOKEN" -H "Content-Type: application/json"`,
    body === undefined ? "" : "--data-binary @-",
    `"$PUBLIC_URL${path}"`,
  ].join(" ")
  const result = spawnSync("ssh", ["-o", "ConnectTimeout=15", HOST, remote], {
    input: body === undefined ? "" : JSON.stringify(body),
    encoding: "utf-8",
  })
  if (result.error) throw new Error(`ssh ${HOST}: ${result.error.message}`)
  if (result.status !== 0) throw new Error(`ssh ${HOST} failed: ${result.stderr.trim() || `exit ${result.status}`}`)
  let answer: { data?: unknown; errors?: { message: string }[] }
  try {
    answer = JSON.parse(result.stdout)
  } catch {
    throw new Error(`Directus answered something that isn't JSON: ${result.stdout.slice(0, 200)}`)
  }
  if (answer.errors) throw new Error(`Directus refused: ${answer.errors.map((error) => error.message).join("; ")}`)
  return answer.data
}

/** The site takes a moment after a write; a 200 within a few tries is good enough. */
async function livePageStatus(url: string): Promise<number> {
  let status = 0
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await new Promise((done) => setTimeout(done, 3000))
    try {
      status = (await fetch(url, { redirect: "follow", headers: { "user-agent": "livius (sbozh.me release note check)" } })).status
    } catch {
      status = 0
    }
    if (status === 200) break
  }
  return status
}

function findByVersion(directus: Directus, version: string): Remote | null {
  const found = directus("GET", `/items/release_notes?filter[version][_eq]=v${version}&fields=${FIELDS}&limit=-1`) as Remote[]
  if (found.length > 1) {
    throw new Error(`production has ${found.length} notes for v${version} (${found.map((note) => note.slug).join(", ")}): remove the extra one by hand`)
  }
  return found[0] ?? null
}

/** Creates the note, or updates the one production already has for that version. */
export async function postNote(note: Note, deps: Deps): Promise<void> {
  const url = releaseUrl(note)
  const taken = deps.directus(
    "GET",
    `/items/release_notes?filter[slug][_eq]=${note.slug}&filter[version][_neq]=v${note.version}&fields=version&limit=1`
  ) as { version: string }[]
  if (taken.length) throw new Error(`slug "${note.slug}" already belongs to ${taken[0].version}: Livius must pick another`)

  const existing = findByVersion(deps.directus, note.version)
  if (existing) {
    const moved = existing.slug === note.slug ? "" : ` (slug ${existing.slug} → ${note.slug})`
    deps.directus("PATCH", `/items/release_notes/${existing.id}`, updatePayload(note))
    deps.log(`updated the v${note.version} note in production${moved}`)
  } else {
    deps.directus("POST", "/items/release_notes", createPayload(note, deps.now()))
    deps.log(`posted the v${note.version} note to production, mail off until the deploy`)
  }

  const status = await deps.pageStatus(url)
  if (status !== 200) throw new Error(`the note is in Directus, but ${url} answered ${status || "nothing"}`)
  deps.log(`✓ ${url} answers 200`)
}

/** Turns the subscriber mail on and waits for the sweep to claim the note. */
export async function mailNote(version: string, deps: Deps, dryRun = false): Promise<void> {
  const existing = findByVersion(deps.directus, version)
  if (!existing) throw new Error(`production has no note for v${version}: post it first (livius-publish.ts post ${version})`)
  if (existing.status !== "published") throw new Error(`the v${version} note is ${existing.status}, not published`)
  if (existing.announced_at) {
    deps.log(`v${version} was already announced at ${existing.announced_at}: nothing to mail`)
    return
  }
  // Directus reads the naive date_released as UTC
  const age = deps.now().getTime() - Date.parse(`${existing.date_released}Z`)
  if (age > MAX_MAIL_AGE_MS) {
    deps.log(`not mailed: the v${version} note is dated ${existing.date_released}, more than 3 days ago, and the sweep never mails those`)
    return
  }
  if (dryRun) {
    deps.log(`dry run: would turn notify_subscribers on for v${version} (${existing.slug}), which mails the releases topic`)
    return
  }

  // The save fires the Directus flow, which calls /api/announce on the site
  deps.directus("PATCH", `/items/release_notes/${existing.id}`, { notify_subscribers: true })
  for (let waited = 0; waited < 90_000; waited += 5000) {
    await deps.sleep(5000)
    const claimed = findByVersion(deps.directus, version)?.announced_at
    if (!claimed) continue
    // The sweep claims before it sends and releases the claim if nobody could be reached
    await deps.sleep(8000)
    if (findByVersion(deps.directus, version)?.announced_at) {
      deps.log(`✓ mailed: the v${version} note was announced at ${claimed}`)
      return
    }
    break
  }
  deps.log(`mail is on for v${version}, but the site hasn't announced it yet: the 15-minute flow retries`)
}

// ---------------------------------------------------------------------------

function readDraft(version: string): Note {
  const file = join(NOTES, `${version}.md`)
  const shown = relative(process.cwd(), file) || file
  if (!existsSync(file)) throw new Error(`${shown} doesn't exist: Livius drafts it (/commit push runs him, or /commit notes ${version})`)
  let note: Note
  try {
    note = parseNote(readFileSync(file, "utf-8"))
  } catch (error) {
    throw new Error(`${shown}: ${(error as Error).message}`)
  }
  if (note.version !== version) throw new Error(`${shown} is stamped ${note.version}, not ${version}`)
  return note
}

const HELP = `Livius: release notes in production (drafts in ${relative(process.cwd(), NOTES) || NOTES})

  check <version>             validate the draft; the last line is its slug
  post <version> [--dry-run]  create or update the note in production, mail off
  mail <version> [--dry-run]  turn the subscriber mail on (after the deploy)
  status <version>            what production holds for that version`

async function main() {
  const [command, rawVersion = "", ...flags] = process.argv.slice(2)
  if (!command || ["help", "--help", "-h"].includes(command)) return console.log(HELP)
  const version = rawVersion.replace(/^v/, "")
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`"${rawVersion}" is not a version (x.y.z)\n\n${HELP}`)
  const dryRun = flags.includes("--dry-run")
  const deps: Deps = {
    directus: directusOverSsh,
    pageStatus: livePageStatus,
    log: console.log,
    now: () => new Date(),
    sleep: (ms) => new Promise((done) => setTimeout(done, ms)),
  }

  switch (command) {
    case "check": {
      const note = readDraft(version)
      console.log(`✓ ${note.version} «${note.title}» (${note.type}) → ${releaseUrl(note)}`)
      console.log(note.slug)
      break
    }
    case "post": {
      const note = readDraft(version)
      if (dryRun) {
        console.log(JSON.stringify(createPayload(note, deps.now()), null, 2))
        console.log(`dry run: nothing sent. Would create the v${version} note, or update the text of the one production has, at ${releaseUrl(note)}`)
        break
      }
      await postNote(note, deps)
      break
    }
    case "mail":
      await mailNote(version, deps, dryRun)
      break
    case "status": {
      const existing = findByVersion(deps.directus, version)
      if (!existing) return console.log(`production has no note for v${version}`)
      const mail = existing.announced_at ? `announced ${existing.announced_at}` : existing.notify_subscribers ? "mail on, not announced yet" : "mail off"
      console.log(`v${version}: ${existing.status}, ${existing.slug}, dated ${existing.date_released}, ${mail}`)
      break
    }
    default:
      throw new Error(`unknown command "${command}"\n\n${HELP}`)
  }
}

// Only when run as a script: the test file imports the functions above
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main()
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}
