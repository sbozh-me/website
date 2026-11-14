"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, X } from "lucide-react"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { useGlitchesEnabled, WindowToggle } from "@/lib/blog/glitch/window"
import { choiceKey, lineKey, resolveScene, type ScrollTarget, type Target } from "@/lib/kagurame/fabula"
import type { KagurameScript } from "@/lib/kagurame/script"

const SEEN_KEY = "sbozh:kagurame:met"
const TYPE_MS = 22
// One slow turn of the brand ✳ on the "Ave ✳" button
const SPIN_SECONDS = 10

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1"
  } catch {
    return false
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1")
  } catch {
    // Private mode: he'll just greet them as a stranger again
  }
}

/**
 * Types `text` out, starting over on every new `line`. The text itself may change mid-line
 * (the window flips a glitch word's reading): typing just carries on over the new words.
 */
function useTypewriter(text: string, instant: boolean, line: unknown) {
  const [shown, setShown] = useState(instant ? Infinity : 0)
  const length = useRef(text.length)
  length.current = text.length

  useEffect(() => {
    if (instant) {
      setShown(Infinity)
      return
    }
    setShown(0)
    const timer = setInterval(() => {
      setShown((n) => {
        if (n >= length.current) {
          clearInterval(timer)
          return n
        }
        return n + 1
      })
    }, TYPE_MS)
    return () => clearInterval(timer)
  }, [line, instant])

  return {
    visible: text.slice(0, shown),
    done: shown >= text.length,
    skip: () => setShown(Infinity),
  }
}

// The brand ✳ on the "Ave ✳" button that opens Kagurame
const MARK_PX = 18

/** The brand ✳ (purple half, gold half), turning slowly; still under reduced motion. */
function SpinningSpark({ still }: { still: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      data-spinning={still ? undefined : ""}
      className="block size-full"
      animate={still ? undefined : { rotate: 360 }}
      transition={still ? undefined : { repeat: Infinity, duration: SPIN_SECONDS, ease: "linear" }}
    >
      <Image src="/android-chrome-192x192.png" alt="" width={MARK_PX} height={MARK_PX} className="size-full" />
    </motion.span>
  )
}

interface PanelProps {
  script: KagurameScript
  reduceMotion: boolean
  onScroll: (target: ScrollTarget) => void
  onClose: () => void
}

const choiceClass =
  "group h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left font-[inherit] text-muted-foreground hover:bg-primary/10 hover:text-primary"

/**
 * One conversation. It mounts on every opening, so he always starts from his first line
 * and types it out again; while it fades out it keeps its last line.
 */
function DialoguePanel({ script, reduceMotion, onScroll, onClose }: PanelProps) {
  const router = useRouter()
  const { fabula, latestPost, lines, name, subtitle } = script
  const [context] = useState(() => ({ returning: readSeen(), latestPost }))
  // A scene's line is picked once per visit: a ~ pool must not reshuffle on every render
  const [scene, setScene] = useState(() => resolveScene(fabula, "start", context))

  // The window (W) is page-wide: with it ON, glitch words read their `>` state and some
  // replies lead elsewhere (`-> ==ave|>color==`)
  const windowOn = useGlitchesEnabled(true)
  const pathOf = useCallback(
    (choice: { target: Target; openTarget?: Target }) =>
      windowOn && choice.openTarget ? choice.openTarget : choice.target,
    [windowOn]
  )

  // A glitch line types out as plain text, then the rendered line takes its place
  const rich = lines[lineKey(scene.scene, scene.variant)]
  const { visible, done, skip } = useTypewriter(
    rich ? (windowOn ? rich.open : rich.plain) : scene.text,
    reduceMotion,
    scene
  )

  const act = useCallback(
    (target: Target) => {
      markSeen()
      switch (target.kind) {
        case "scene":
          setScene(resolveScene(fabula, target.scene, context))
          break
        case "route":
          router.push(target.href)
          break
        case "external":
          window.open(target.href, "_blank", "noopener")
          break
        case "scroll":
          onClose()
          onScroll(target.to)
          break
        case "close":
          onClose()
      }
    },
    [fabula, context, router, onScroll, onClose]
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return
      if (event.key === "Escape") {
        onClose()
        return
      }
      const index = Number(event.key) - 1
      if (!Number.isInteger(index) || index < 0) return
      if (!done) {
        skip()
        return
      }
      const choice = scene.choices[index]
      if (choice) act(pathOf(choice))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [done, skip, scene, act, pathOf, onClose])

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label={name.plain}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="pointer-events-auto relative w-full max-w-2xl rounded-lg border border-primary/40 bg-background/75 p-4 font-[family-name:var(--font-jetbrains-mono)] text-sm shadow-[0_0_40px_-12px_var(--color-primary)] backdrop-blur-md md:p-5 md:text-base"
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-secondary">
          {name.node}
          {subtitle && (
            <>
              {" "}
              <span className="text-muted-foreground">· {subtitle.node}</span>
            </>
          )}
        </p>
        <div className="-mr-2 -mt-1 flex shrink-0 items-center gap-1">
          <WindowToggle off />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close dialogue"
            className="text-muted-foreground hover:text-foreground"
          >
            <X />
          </Button>
        </div>
      </div>

      {/* Clicking the line finishes typing it */}
      <p onClick={skip} aria-live="polite" className="min-h-[3lh] cursor-default text-foreground md:min-h-[2lh]">
        {done && rich ? rich.node : visible}
        {!done && <span className="ml-0.5 inline-block animate-pulse text-primary">▍</span>}
      </p>

      <ol
        aria-label="Replies"
        className={`mt-3 flex flex-col gap-0.5 transition-opacity duration-200 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {scene.choices.map((choice, i) => {
          const { label } = choice
          const target = pathOf(choice)
          const number = <span className="w-4 shrink-0 text-primary/60 group-hover:text-secondary">{i + 1}.</span>
          // A reply may glitch too (the fourth opener asks about colour with the window ON)
          const text = lines[choiceKey(scene.scene, scene.variant, i)]?.node ?? label
          return (
            <li key={`${scene.scene}-${scene.variant}-${label}`}>
              {target.kind === "external" ? (
                // A real link: the new tab opens from the click itself, and the URL shows on hover
                <Button asChild variant="ghost" tabIndex={done ? 0 : -1} className={choiceClass}>
                  <a href={target.href} target="_blank" rel="noopener" onClick={markSeen}>
                    {number}
                    {text}
                    {/* Wrapped: a bare <svg> child would widen the button's padding (has-[>svg]) */}
                    <span aria-hidden="true" className="inline-flex opacity-60">
                      <ArrowUpRight className="size-3.5" />
                    </span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => act(target)} tabIndex={done ? 0 : -1} className={choiceClass}>
                  {number}
                  {text}
                </Button>
              )}
            </li>
          )
        })}
      </ol>
    </motion.div>
  )
}

interface HeroDialogueProps {
  /** Kagurame's script, prepared on the server; without one he stays away and only the toolbar shows */
  script?: KagurameScript | null
  onScroll: (target: ScrollTarget) => void
  /** Controlled by the hero, which opens it when the video first ends */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sits above the dialogue or the "Ave ✳" button: the video's Play/Pause and sound */
  toolbar?: ReactNode
}

/**
 * RPG-style onboarding: Kagurame talks from the 5th dimension, the visitor picks a reply,
 * and the replies lead to the blog, the Forum, projects, release notes and subscriptions.
 * Number keys pick a reply, Escape tucks him away behind the "Ave ✳" button.
 *
 * His lines live in `content/kagurame/onboarding.fabula` (see lib/kagurame/fabula.ts).
 *
 * The window starts OFF (as `==WINDOW OFF==` in a post): his title reads "17th Company".
 * Open it (button or W) and it glitches into "17th Dimension" and a red "17th Legion",
 * and so do the glitch words in his lines.
 */
export function HeroDialogue({ script, onScroll, open, onOpenChange, toolbar }: HeroDialogueProps) {
  const reduceMotion = useReducedMotion() ?? false
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 flex flex-col items-center gap-3 px-4 md:px-12">
      {toolbar && <div className="pointer-events-auto">{toolbar}</div>}
      {script && (
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <DialoguePanel
              key="dialogue"
              script={script}
              reduceMotion={reduceMotion}
              onScroll={onScroll}
              onClose={close}
            />
          ) : (
            <motion.div
              key="talk"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto"
            >
              {/* "Ave ✳": a Roman hello, with the brand ✳ turning slowly; opens Kagurame */}
              <Button
                variant="outline"
                onClick={() => onOpenChange(true)}
                aria-label="Ave. Talk to Kagurame"
                title="Talk to Kagurame"
                className="rounded-full bg-background/40 backdrop-blur-md"
              >
                Ave
                <span className="inline-block shrink-0" style={{ width: MARK_PX, height: MARK_PX }}>
                  <SpinningSpark still={reduceMotion} />
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
