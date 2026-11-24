"use client"

import { useEffect, useState } from "react"

const KEY = "sbozh:video:muted"

/** Read the saved mute choice; default to muted so autoplay is never blocked */
export function readMuted(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "0"
  } catch {
    return true
  }
}

/** Save the mute choice; silent on private-mode / quota errors */
export function writeMuted(muted: boolean) {
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0")
  } catch {
    // Storage blocked: the visitor will just pick again next time
  }
}

/**
 * Mute state wired to localStorage. The initial state is `true` (muted) so SSR and the
 * first client render agree — the saved choice is applied in an effect, which also
 * picks up changes from another tab via the storage event. Setting through the
 * returned function persists the new value.
 */
export function usePersistentMuted(): [boolean, (muted: boolean) => void] {
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    setMuted(readMuted())
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) setMuted(readMuted())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const save = (next: boolean) => {
    setMuted(next)
    writeMuted(next)
  }

  return [muted, save]
}
