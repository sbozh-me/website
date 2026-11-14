"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@sbozh/react-ui/components/ui/button"
import { Glitch, GlitchState } from "@/lib/blog/glitch/glitch"
import { WindowToggle } from "@/lib/blog/glitch/window"
import { resolveLine, type Action, type LatestPost, type NodeId } from "./dialogue"

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

function useTypewriter(text: string, instant: boolean) {
  const [shown, setShown] = useState(instant ? text.length : 0)

  useEffect(() => {
    if (instant) {
      setShown(text.length)
      return
    }
    setShown(0)
    const timer = setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          clearInterval(timer)
          return n
        }
        return n + 1
      })
    }, TYPE_MS)
    return () => clearInterval(timer)
  }, [text, instant])

  return {
    visible: text.slice(0, shown),
    done: shown >= text.length,
    skip: () => setShown(text.length),
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
  latestPost?: LatestPost
  reduceMotion: boolean
  onScroll: (target: "content" | "releases") => void
  onClose: () => void
}

/**
 * One conversation. It mounts on every opening, so he always starts from his first line
 * and types it out again; while it fades out it keeps its last line.
 */
function DialoguePanel({ latestPost, reduceMotion, onScroll, onClose }: PanelProps) {
  const router = useRouter()
  const [node, setNode] = useState<NodeId>("start")
  const [returning] = useState(readSeen)

  const line = resolveLine(node, { latestPost, returning })
  const { visible, done, skip } = useTypewriter(line.text, reduceMotion)

  const act = useCallback(
    (action: Action) => {
      markSeen()
      if ("goto" in action) setNode(action.goto)
      else if ("decide" in action) setNode("decided")
      else if ("href" in action) router.push(action.href)
      else if ("scroll" in action) {
        onClose()
        onScroll(action.scroll)
      } else onClose()
    },
    [router, onScroll, onClose]
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
      const choice = line.choices[index]
      if (choice) act(choice.action)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [done, skip, line, act, onClose])

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label="Kagurame"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="pointer-events-auto relative w-full max-w-2xl rounded-lg border border-primary/40 bg-background/75 p-4 font-[family-name:var(--font-jetbrains-mono)] text-sm shadow-[0_0_40px_-12px_var(--color-primary)] backdrop-blur-md md:p-5 md:text-base"
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.2em] text-secondary">
          Kagurame{" "}
          <span className="text-muted-foreground">
            ·{" "}
            <Glitch windowOff>
              <GlitchState plain>17th Company</GlitchState>
              <GlitchState color="purple">17th Dimension</GlitchState>
              <GlitchState color="red">17th Legion</GlitchState>
            </Glitch>
          </span>
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
        {visible}
        {!done && <span className="ml-0.5 inline-block animate-pulse text-primary">▍</span>}
      </p>

      <ol
        aria-label="Replies"
        className={`mt-3 flex flex-col gap-0.5 transition-opacity duration-200 ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {line.choices.map((choice, i) => (
          <li key={`${node}-${choice.label}`}>
            <Button
              variant="ghost"
              onClick={() => act(choice.action)}
              tabIndex={done ? 0 : -1}
              className="group h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left font-[inherit] text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <span className="w-4 shrink-0 text-primary/60 group-hover:text-secondary">{i + 1}.</span>
              {choice.label}
            </Button>
          </li>
        ))}
      </ol>
    </motion.div>
  )
}

interface HeroDialogueProps {
  latestPost?: LatestPost
  onScroll: (target: "content" | "releases") => void
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
 * The window starts OFF (as `==WINDOW OFF==` in a post): his title reads "17th Company".
 * Open it (button or W) and it glitches into "17th Dimension" and a red "17th Legion".
 */
export function HeroDialogue({ latestPost, onScroll, open, onOpenChange, toolbar }: HeroDialogueProps) {
  const reduceMotion = useReducedMotion() ?? false
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 flex flex-col items-center gap-3 px-4 md:px-12">
      {toolbar && <div className="pointer-events-auto">{toolbar}</div>}
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <DialoguePanel
            key="dialogue"
            latestPost={latestPost}
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
    </div>
  )
}
