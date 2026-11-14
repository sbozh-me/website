/**
 * Picks SD or HD for the home video before it starts, so nobody downloads both:
 *
 * 1. The screen: HD only where it has clearly more pixels than the SD file.
 * 2. The browser's network hints (Chromium), for the clear cases only: Save-Data or a slow
 *    connection → SD; a reported downlink of at least twice the HD bitrate → HD. (Chrome
 *    caps that figure at 10 Mbps, so the HD files are encoded to need well under it.) A low
 *    figure on a "4g" connection decides nothing: it's an estimate from recent traffic, and
 *    a fresh profile on a fast line reports ~1.75.
 * 3. Otherwise (no hints, as in Safari and Firefox, or an unclear one): time the first
 *    512KB of the HD file itself, at most 1.2s, and go HD only at twice its bitrate.
 *
 * The network verdict is kept for the session; `?video=hd|sd` forces one (for testing).
 */

export type Quality = "sd" | "hd"

export interface Rendition {
  sd: string
  hd: string
  /** The SD file's long edge in pixels (HD is 1920) */
  sdLongEdge: number
  /** The HD file's average bitrate, Mbps */
  hdMbps: number
}

export interface ScreenSize {
  width: number
  height: number
  dpr: number
}

export interface ConnectionHints {
  saveData?: boolean
  effectiveType?: string
  /** Mbps, as the browser estimates it */
  downlink?: number
}

/** Download at least this many times faster than HD plays, or stay SD */
export const HEADROOM = 2
export const STORAGE_KEY = "sbozh:video-quality"
const PROBE_BYTES = 512 * 1024
const PROBE_TIMEOUT_MS = 1200

/** Does the screen have clearly more pixels along the video's long edge than SD gives? */
export function screenWantsHd(rendition: Rendition, screen: ScreenSize): boolean {
  return Math.max(screen.width, screen.height) * screen.dpr > rendition.sdLongEdge * 1.25
}

/** What the browser's connection hints say, or "unknown" when they don't say enough. */
export function networkVerdict(hints: ConnectionHints | undefined, hdMbps: number): Quality | "unknown" {
  if (!hints) return "unknown"
  if (hints.saveData) return "sd"
  if (hints.effectiveType && hints.effectiveType !== "4g") return "sd"
  // Only a high estimate is an answer; a low one gets measured (see above)
  if (typeof hints.downlink === "number" && hints.downlink >= hdMbps * HEADROOM) return "hd"
  return "unknown"
}

/**
 * Mbps over the first `bytes` of `url`, read as a stream and cut off there whatever the
 * server sends back (a server that ignores Range must not cost the whole file). A probe
 * that runs out of time reports the rate so far; one that fails reports null.
 */
export async function probeMbps(
  url: string,
  {
    bytes = PROBE_BYTES,
    timeoutMs = PROBE_TIMEOUT_MS,
    fetchImpl = fetch,
    now = () => performance.now(),
  }: { bytes?: number; timeoutMs?: number; fetchImpl?: typeof fetch; now?: () => number } = {}
): Promise<number | null> {
  const controller = new AbortController()
  const started = now()
  let received = 0
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, {
      headers: { Range: `bytes=0-${bytes - 1}` },
      cache: "no-store",
      signal: controller.signal,
    })
    if (!response.ok || !response.body) return null
    const reader = response.body.getReader()
    while (received < bytes) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
    }
    controller.abort()
  } catch {
    if (!received) return null
  } finally {
    clearTimeout(timer)
  }
  const seconds = Math.max(now() - started, 1) / 1000
  return (received * 8) / seconds / 1e6
}

function readStored(storage: Storage | undefined): Quality | null {
  try {
    const value = storage?.getItem(STORAGE_KEY)
    return value === "hd" || value === "sd" ? value : null
  } catch {
    return null
  }
}

function store(storage: Storage | undefined, quality: Quality) {
  try {
    storage?.setItem(STORAGE_KEY, quality)
  } catch {
    // Private mode: decide again next page
  }
}

export interface QualityEnv {
  screen: ScreenSize
  connection?: ConnectionHints
  storage?: Storage
  /** `?video=hd|sd` */
  forced?: string | null
  probe?: (url: string) => Promise<number | null>
}

/** The quality to start with, when it's known at once; null means a probe has to decide. */
export function quickQuality(rendition: Rendition, env: QualityEnv): Quality | null {
  if (env.forced === "hd" || env.forced === "sd") return env.forced
  if (!screenWantsHd(rendition, env.screen)) return "sd"
  const verdict = networkVerdict(env.connection, rendition.hdMbps)
  if (verdict !== "unknown") {
    store(env.storage, verdict)
    return verdict
  }
  return readStored(env.storage)
}

/** quickQuality, or failing that a timed probe of the HD file (kept for the session). */
export async function chooseQuality(rendition: Rendition, env: QualityEnv): Promise<Quality> {
  const quick = quickQuality(rendition, env)
  if (quick) return quick
  const mbps = await (env.probe ?? probeMbps)(rendition.hd)
  const quality: Quality = mbps !== null && mbps >= rendition.hdMbps * HEADROOM ? "hd" : "sd"
  store(env.storage, quality)
  return quality
}

/** The browser's side of QualityEnv. */
export function browserQualityEnv(): QualityEnv {
  const nav = navigator as Navigator & { connection?: ConnectionHints }
  let forced: string | null = null
  try {
    forced = new URL(window.location.href).searchParams.get("video")
  } catch {
    forced = null
  }
  let storage: Storage | undefined
  try {
    storage = window.sessionStorage
  } catch {
    storage = undefined
  }
  return {
    screen: { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1 },
    connection: nav.connection,
    storage,
    forced,
  }
}
