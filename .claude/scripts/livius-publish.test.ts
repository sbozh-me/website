/**
 * node --test .claude/scripts/livius-publish.test.ts
 *
 * No network and no server: production is a fake that records what it was asked.
 */

import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { createPayload, mailNote, parseNote, postNote, releaseUrl, stampDate, updatePayload } from "./livius-publish.ts"
import type { Deps, Remote } from "./livius-publish.ts"

const FULL = `# Release note 1.11.0

| Field | Value |
|---|---|
| title | A poster for GTA is near |
| slug | a-poster-for-gta-is-near |
| version | 1.11.0 |
| type | feature |
| date_released | 2026-11-16 |
| project | sbozh.me |
| media | optional: \`apps/web/public/images/home/gta-is-near-poster.png\` |

---

## New Features

- **GTA is near** - The home page now has a poster.

## Bug Fixes

- **Announcement emails** - They reach this site now.

The poster went up before the post.
`

const MINIMAL = `# Release note 1.10.9

| Field | Value |
|---|---|
| title | Load more button fix |
| slug | load-more-button-fix |
| version | 1.10.9 |
| type | fix |
| date_released | 2026-11-12 |
| project | sbozh.me |
| media | none |

---

## Bug Fixes

- **Load more** - It loads more again.
`

interface Call {
  method: string
  path: string
  body?: unknown
}

/** A production that holds `notes` and answers the way Directus does. */
function fakeDeps(notes: Remote[], options: { page?: number; onPatch?: (note: Remote, body: Record<string, unknown>) => void } = {}) {
  const calls: Call[] = []
  const logs: string[] = []
  const deps: Deps = {
    directus: (method, path, body) => {
      calls.push({ method, path, body })
      if (method === "GET" && path.includes("filter[slug]")) {
        const slug = /filter\[slug\]\[_eq\]=([^&]+)/.exec(path)![1]
        const version = /filter\[version\]\[_neq\]=([^&]+)/.exec(path)![1]
        return notes.filter((note) => note.slug === slug && note.version !== version)
      }
      if (method === "GET") {
        const version = /filter\[version\]\[_eq\]=([^&]+)/.exec(path)![1]
        return notes.filter((note) => note.version === version)
      }
      if (method === "PATCH") {
        const note = notes.find((candidate) => path.endsWith(candidate.id))!
        Object.assign(note, body)
        options.onPatch?.(note, body as Record<string, unknown>)
        return note
      }
      return { id: "new", ...(body as object) }
    },
    pageStatus: async () => options.page ?? 200,
    log: (line) => logs.push(line),
    now: () => new Date("2026-11-16T15:00:00Z"),
    sleep: async () => {},
  }
  return { deps, calls, logs }
}

const remote = (overrides: Partial<Remote> = {}): Remote => ({
  id: "24837c83-f6db-4562-a9f2-af15d087dc04",
  version: "v1.11.0",
  slug: "a-poster-for-gta-is-near",
  status: "published",
  date_released: "2026-11-16T14:00:00",
  notify_subscribers: false,
  announced_at: null,
  ...overrides,
})

test("parses Livius's full format", () => {
  const note = parseNote(FULL)
  assert.equal(note.title, "A poster for GTA is near")
  assert.equal(note.slug, "a-poster-for-gta-is-near")
  assert.equal(note.version, "1.11.0")
  assert.equal(note.type, "feature")
  assert.equal(note.date, "2026-11-16")
  assert.ok(note.summary.startsWith("## New Features"))
  assert.ok(note.summary.endsWith("The poster went up before the post."))
  assert.equal(releaseUrl(note), "https://sbozh.me/projects/sbozh-me/releases/a-poster-for-gta-is-near")
})

test("parses a note with one section, no media and no closing line", () => {
  const note = parseNote(MINIMAL)
  assert.equal(note.type, "fix")
  assert.equal(note.summary, "## Bug Fixes\n\n- **Load more** - It loads more again.")
})

test("names every problem in a broken draft", () => {
  const broken = FULL.replace("| type | feature |", "| type | shiny |").replace("a-poster-for-gta-is-near", "A Poster!")
  assert.throws(() => parseNote(broken), /slug "A Poster!" is not lowercase kebab-case; type "shiny" is not one of/)
  assert.throws(() => parseNote(FULL.replace("\n---\n", "\n")), /no `---` line/)
  assert.throws(() => parseNote(FULL.replace(/## /g, "### ")), /no `## ` section/)
  assert.throws(() => parseNote(FULL.replace("| project | sbozh.me |", "| project | elsewhere |")), /project "elsewhere" is unknown/)
})

test("a new note is published with the mail off and no field Directus lacks", () => {
  const payload = createPayload(parseNote(FULL), new Date("2026-11-16T15:04:05Z"))
  assert.deepEqual(Object.keys(payload).sort(), [
    "date_released",
    "notify_subscribers",
    "project",
    "slug",
    "status",
    "summary",
    "title",
    "type",
    "version",
  ])
  assert.equal(payload.version, "v1.11.0")
  assert.equal(payload.status, "published")
  assert.equal(payload.notify_subscribers, false)
  assert.equal(payload.project, "0c8fe541-aaf3-4669-a523-26bce5fa8b36")
  assert.equal(payload.date_released, "2026-11-16T15:04:05")
})

test("an update leaves the date and both mail fields alone", () => {
  assert.deepEqual(Object.keys(updatePayload(parseNote(FULL))).sort(), ["project", "slug", "status", "summary", "title", "type"])
})

test("today's draft is stamped with the posting time in UTC, an older one keeps its day", () => {
  assert.equal(stampDate("2026-11-16", new Date("2026-11-16T15:04:05Z")), "2026-11-16T15:04:05")
  assert.equal(stampDate("2026-11-12", new Date("2026-11-16T15:04:05Z")), "2026-11-12T12:00:00")
})

test("post creates the note when production has none for the version", async () => {
  const { deps, calls, logs } = fakeDeps([])
  await postNote(parseNote(FULL), deps)
  const writes = calls.filter((call) => call.method !== "GET")
  assert.equal(writes.length, 1)
  assert.equal(writes[0].method, "POST")
  assert.equal(writes[0].path, "/items/release_notes")
  assert.equal((writes[0].body as { date_released: string }).date_released, "2026-11-16T15:00:00")
  assert.match(logs.join("\n"), /posted the v1\.11\.0 note.*mail off[\s\S]*answers 200/)
})

test("post updates the note production already has, never a second one", async () => {
  const existing = remote({ slug: "old-slug", notify_subscribers: true, announced_at: "2026-11-16T14:05:00.000Z" })
  const { deps, calls, logs } = fakeDeps([existing])
  await postNote(parseNote(FULL), deps)
  const writes = calls.filter((call) => call.method !== "GET")
  assert.deepEqual(
    writes.map((call) => `${call.method} ${call.path}`),
    [`PATCH /items/release_notes/${existing.id}`]
  )
  assert.equal(existing.slug, "a-poster-for-gta-is-near")
  assert.equal(existing.announced_at, "2026-11-16T14:05:00.000Z")
  assert.equal(existing.date_released, "2026-11-16T14:00:00")
  assert.match(logs[0], /slug old-slug → a-poster-for-gta-is-near/)
})

test("post refuses a slug another version holds, and two notes for one version", async () => {
  const other = fakeDeps([remote({ version: "v1.9.0" })])
  await assert.rejects(postNote(parseNote(FULL), other.deps), /already belongs to v1\.9\.0/)
  assert.equal(other.calls.filter((call) => call.method !== "GET").length, 0)

  const twice = fakeDeps([remote({ slug: "one" }), remote({ id: "b", slug: "two" })])
  await assert.rejects(postNote(parseNote(FULL), twice.deps), /2 notes for v1\.11\.0 \(one, two\)/)
})

test("post fails when the page doesn't answer", async () => {
  const { deps } = fakeDeps([], { page: 404 })
  await assert.rejects(postNote(parseNote(FULL), deps), /releases\/a-poster-for-gta-is-near answered 404/)
})

test("mail turns notify_subscribers on and reports the announcement", async () => {
  const note = remote()
  const { deps, calls, logs } = fakeDeps([note], {
    // The site's sweep claims the note as soon as the save fires the flow
    onPatch: (saved) => {
      saved.announced_at = "2026-11-16T15:00:02.000Z"
    },
  })
  await mailNote("1.11.0", deps)
  assert.deepEqual(
    calls.filter((call) => call.method === "PATCH").map((call) => call.body),
    [{ notify_subscribers: true }]
  )
  assert.match(logs.at(-1)!, /✓ mailed: the v1\.11\.0 note was announced at 2026-11-16T15:00:02/)
})

test("mail says so when the site hasn't announced the note in time", async () => {
  const { deps, logs } = fakeDeps([remote()])
  await mailNote("1.11.0", deps)
  assert.match(logs.at(-1)!, /hasn't announced it yet: the 15-minute flow retries/)
})

test("mail writes nothing for a note that was announced, is too old, or in a dry run", async () => {
  const announced = fakeDeps([remote({ announced_at: "2026-11-16T14:05:00.000Z" })])
  await mailNote("1.11.0", announced.deps)
  assert.match(announced.logs[0], /already announced/)

  const old = fakeDeps([remote({ date_released: "2026-11-12T12:00:00" })])
  await mailNote("1.11.0", old.deps)
  assert.match(old.logs[0], /not mailed: .* more than 3 days ago/)

  const dry = fakeDeps([remote()])
  await mailNote("1.11.0", dry.deps, true)
  assert.match(dry.logs[0], /dry run/)

  for (const { calls } of [announced, old, dry]) assert.equal(calls.filter((call) => call.method !== "GET").length, 0)
})

test("mail refuses a version production has no note for, or a draft", async () => {
  await assert.rejects(mailNote("1.11.0", fakeDeps([]).deps), /no note for v1\.11\.0: post it first/)
  await assert.rejects(mailNote("1.11.0", fakeDeps([remote({ status: "draft" })]).deps), /is draft, not published/)
})

// The drafts are git-ignored, so this one runs only where 1.11.0's draft exists
const SCRIPTS = dirname(fileURLToPath(import.meta.url))
const DRAFT = resolve(SCRIPTS, "../../release-notes/1.11.0.md")
test("the CLI's dry run prints the payload and nothing secret", { skip: !existsSync(DRAFT) }, () => {
  const run = spawnSync(process.execPath, [join(SCRIPTS, "livius-publish.ts"), "post", "1.11.0", "--dry-run"], { encoding: "utf-8" })
  assert.equal(run.status, 0)
  const payload = JSON.parse(run.stdout.slice(0, run.stdout.lastIndexOf("}") + 1))
  assert.equal(payload.version, "v1.11.0")
  assert.equal(payload.slug, "a-poster-for-gta-is-near")
  assert.equal(payload.notify_subscribers, false)
  assert.doesNotMatch(run.stdout + run.stderr, /Bearer|DIRECTUS_TOKEN|announced_at/)
  assert.match(run.stdout, /dry run: nothing sent/)
})
