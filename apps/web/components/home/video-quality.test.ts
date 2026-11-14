import { describe, expect, it, vi } from "vitest"
import {
  chooseQuality,
  HEADROOM,
  networkVerdict,
  probeMbps,
  quickQuality,
  screenWantsHd,
  STORAGE_KEY,
  type QualityEnv,
  type Rendition,
} from "./video-quality"

const desktop: Rendition = { sd: "/sd.mp4", hd: "/hd.mp4", sdLongEdge: 832, hdMbps: 4.7 }
const laptop = { width: 1440, height: 900, dpr: 2 }
const smallWindow = { width: 800, height: 600, dpr: 1 }

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  }
}

function env(overrides: Partial<QualityEnv> = {}): QualityEnv {
  return { screen: laptop, storage: memoryStorage(), ...overrides }
}

/** A Response whose body arrives in 64KB chunks, `total` bytes in all */
function streamResponse(total: number, { status = 206 } = {}) {
  let sent = 0
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent >= total) return controller.close()
      const chunk = new Uint8Array(Math.min(65536, total - sent))
      sent += chunk.byteLength
      controller.enqueue(chunk)
    },
  })
  return { response: new Response(body, { status }), sent: () => sent }
}

describe("screenWantsHd", () => {
  it("wants HD only where the screen has clearly more pixels than SD", () => {
    expect(screenWantsHd(desktop, laptop)).toBe(true)
    expect(screenWantsHd(desktop, smallWindow)).toBe(false)
    // A phone in portrait: the long edge counts, in device pixels
    expect(screenWantsHd({ ...desktop, sdLongEdge: 1280 }, { width: 390, height: 844, dpr: 3 })).toBe(true)
    expect(screenWantsHd({ ...desktop, sdLongEdge: 1280 }, { width: 360, height: 640, dpr: 2 })).toBe(false)
  })
})

describe("networkVerdict", () => {
  it("answers only the clear cases: Save-Data, a slow connection, a high downlink", () => {
    expect(networkVerdict(undefined, 4.7)).toBe("unknown")
    expect(networkVerdict({ saveData: true, downlink: 10 }, 4.7)).toBe("sd")
    expect(networkVerdict({ effectiveType: "3g", downlink: 10 }, 4.7)).toBe("sd")
    expect(networkVerdict({ effectiveType: "4g", downlink: 10 }, 4.7)).toBe("hd")
    expect(networkVerdict({ effectiveType: "4g" }, 4.7)).toBe("unknown")
  })

  it("leaves a low downlink on a 4g connection to the probe: a fresh Chrome profile says 1.75", () => {
    expect(networkVerdict({ effectiveType: "4g", downlink: 1.75 }, 4.7)).toBe("unknown")
    expect(networkVerdict({ effectiveType: "4g", downlink: 4.7 * HEADROOM - 0.1 }, 4.7)).toBe("unknown")
  })
})

describe("probeMbps", () => {
  it("times the first bytes of the file and stops reading there", async () => {
    const { response, sent } = streamResponse(10_000_000)
    const fetchImpl = vi.fn(async () => response)
    let clock = 0
    const mbps = await probeMbps("/hd.mp4", { bytes: 512 * 1024, fetchImpl, now: () => (clock += 100) })
    // 512KB in 100ms
    expect(mbps).toBeCloseTo((512 * 1024 * 8) / 0.1 / 1e6, 1)
    expect(fetchImpl).toHaveBeenCalledWith("/hd.mp4", expect.objectContaining({ headers: { Range: "bytes=0-524287" } }))
    // A server that ignores Range doesn't cost the whole file
    expect(sent()).toBeLessThan(1_000_000)
  })

  it("reports nothing for a failed request", async () => {
    expect(await probeMbps("/hd.mp4", { fetchImpl: async () => new Response(null, { status: 404 }) })).toBeNull()
    expect(
      await probeMbps("/hd.mp4", {
        fetchImpl: async () => {
          throw new TypeError("offline")
        },
      })
    ).toBeNull()
  })

  it("gives up on a slow connection after the timeout", async () => {
    const fetchImpl = (_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))))
    expect(await probeMbps("/hd.mp4", { fetchImpl, timeoutMs: 10 })).toBeNull()
  })
})

describe("quickQuality / chooseQuality", () => {
  it("honours ?video=hd|sd", () => {
    expect(quickQuality(desktop, env({ forced: "sd", connection: { effectiveType: "4g", downlink: 10 } }))).toBe("sd")
    expect(quickQuality(desktop, env({ forced: "hd", screen: smallWindow }))).toBe("hd")
  })

  it("keeps SD on a screen that wouldn't show the difference, without asking the network", async () => {
    const probe = vi.fn()
    expect(await chooseQuality(desktop, env({ screen: smallWindow, probe }))).toBe("sd")
    expect(probe).not.toHaveBeenCalled()
  })

  it("trusts the browser's hints and remembers them for the session", () => {
    const storage = memoryStorage()
    expect(quickQuality(desktop, env({ storage, connection: { effectiveType: "4g", downlink: 10 } }))).toBe("hd")
    expect(storage.getItem(STORAGE_KEY)).toBe("hd")
  })

  it("probes when the browser says nothing, and keeps the answer", async () => {
    const storage = memoryStorage()
    const probe = vi.fn(async () => 40)
    expect(quickQuality(desktop, env({ storage }))).toBeNull()
    expect(await chooseQuality(desktop, env({ storage, probe }))).toBe("hd")
    expect(probe).toHaveBeenCalledWith("/hd.mp4")
    // Next time it's known at once
    expect(quickQuality(desktop, env({ storage }))).toBe("hd")
  })

  it("stays SD on a slow or failed probe", async () => {
    expect(await chooseQuality(desktop, env({ probe: async () => 4.7 * HEADROOM - 1 }))).toBe("sd")
    expect(await chooseQuality(desktop, env({ probe: async () => null }))).toBe("sd")
  })

  it("works without storage (private mode)", async () => {
    const broken = memoryStorage()
    broken.getItem = () => {
      throw new Error("denied")
    }
    broken.setItem = () => {
      throw new Error("denied")
    }
    expect(await chooseQuality(desktop, env({ storage: broken, probe: async () => 40 }))).toBe("hd")
  })
})
