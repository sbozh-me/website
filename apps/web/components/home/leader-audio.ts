"use client"

import { useEffect, useRef } from "react"

/**
 * Countdown audio for the 3-2-1 film leader: a short 1 kHz beep on each digit, with a
 * projector ambience running underneath (brown-ish noise, low motor hum and rhythmic
 * ticks). Web Audio API, built on the fly from oscillators and noise buffers: no asset
 * downloads, cold-start ready.
 *
 * `enabled` turns the whole thing on and off (muted/paused leader → no audio). The
 * AudioContext is created lazily on the first user-initiated enable, so autoplay
 * policies are satisfied; on unmount everything stops and the context is closed.
 */
export function useLeaderAudio({ enabled, count }: { enabled: boolean; count: number }) {
  const ctxRef = useRef<AudioContext | null>(null)
  const stopAmbience = useRef<(() => void) | null>(null)
  const lastBeep = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      stopAmbience.current?.()
      stopAmbience.current = null
      return
    }
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = ctxRef.current ?? new Ctx()
    ctxRef.current = ctx
    if (ctx.state === "suspended") ctx.resume().catch(() => {})
    stopAmbience.current = startProjectorAmbience(ctx)
    return () => {
      stopAmbience.current?.()
      stopAmbience.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || count <= 0) {
      lastBeep.current = null
      return
    }
    if (lastBeep.current === count) return
    lastBeep.current = count
    const ctx = ctxRef.current
    if (ctx) playBeep(ctx)
  }, [count, enabled])

  // Close the audio graph for good when the leader unmounts
  useEffect(() => {
    return () => {
      stopAmbience.current?.()
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])
}

/** The classic 1 kHz sync-pop beep from a film leader */
function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.value = 1000
  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.22, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.24)
}

/** Projector rumble: filtered brown noise, a low motor hum, and sprocket ticks at 12 Hz */
function startProjectorAmbience(ctx: AudioContext): () => void {
  const noise = brownNoise(ctx, 2)
  noise.loop = true
  const noiseLP = ctx.createBiquadFilter()
  noiseLP.type = "lowpass"
  noiseLP.frequency.value = 1400
  const noiseGain = ctx.createGain()
  noiseGain.gain.value = 0.08
  noise.connect(noiseLP).connect(noiseGain).connect(ctx.destination)
  noise.start()

  const hum = ctx.createOscillator()
  hum.type = "sawtooth"
  hum.frequency.value = 55
  const humLP = ctx.createBiquadFilter()
  humLP.type = "lowpass"
  humLP.frequency.value = 180
  const humGain = ctx.createGain()
  humGain.gain.value = 0.045
  hum.connect(humLP).connect(humGain).connect(ctx.destination)
  hum.start()

  // 12 Hz sprocket: a short noise burst at the top of each cycle
  const tickBuf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate / 12)), ctx.sampleRate)
  const tickData = tickBuf.getChannelData(0)
  const burst = Math.min(tickData.length, 320)
  for (let i = 0; i < burst; i++) {
    tickData[i] = (Math.random() * 2 - 1) * (1 - i / burst)
  }
  const tick = ctx.createBufferSource()
  tick.buffer = tickBuf
  tick.loop = true
  const tickBP = ctx.createBiquadFilter()
  tickBP.type = "bandpass"
  tickBP.frequency.value = 1800
  tickBP.Q.value = 1.4
  const tickGain = ctx.createGain()
  tickGain.gain.value = 0.18
  tick.connect(tickBP).connect(tickGain).connect(ctx.destination)
  tick.start()

  return () => {
    for (const node of [noise, hum, tick]) {
      try {
        node.stop()
      } catch {
        // already stopped
      }
    }
  }
}

function brownNoise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}
