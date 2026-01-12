# Postmortem: Carousel Debounce Implementation

**Date:** 2026-01-12
**Component:** PersonaCarousel
**Resolution:** Claude Opus 4.5 implemented correctly on first attempt

---

## The Requirement

User wanted: during rapid clicking, show only logo (hide card animation), but allow navigation state to update. Card should animate in only after user stops clicking.

## What Went Wrong (Previous Attempts)

1. **Misunderstood "debounce"** - Previous attempts tried to debounce the navigation itself (blocking state updates during rapid clicks), when the user wanted to debounce only the *visual rendering*

2. **Conflated concerns** - Mixed up:
   - Navigation state (`activeIndex`) - should update immediately
   - Visual state (`isRapidClicking`) - should control card visibility

3. **Over-complicated with lodash** - Tried using `lodash-es` debounce with `leading`/`trailing` options when a simple `setTimeout` pattern was cleaner

4. **Missed the layout shift issue** - When card was hidden, container collapsed. Previous fix tried hardcoded values (`maxWidth: '32rem'`) instead of measuring actual rendered dimensions

## What Worked (Final Solution)

```typescript
// Simple pattern:
const [isRapidClicking, setIsRapidClicking] = useState(false)
const settleTimerRef = useRef<NodeJS.Timeout | null>(null)

// On click: show logo, reset timer
setIsRapidClicking(true)
clearTimeout(settleTimerRef.current)
settleTimerRef.current = setTimeout(() => setIsRapidClicking(false), 300)

// Render: card only when NOT rapid clicking
{!isRapidClicking && <motion.div>...</motion.div>}
```

For layout stability, measure and preserve both width and height:

```typescript
const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)

// In measurement effect:
if (el.offsetWidth > maxWidth) maxWidth = el.offsetWidth
if (maxWidth > 0) setContainerWidth(maxWidth)

// Apply to container:
style={{ height: containerHeight, width: containerWidth }}
```

## Key Insight

The user's mental model was clear: "I click fast → I see logo → I stop → card slides in". The implementation should mirror this directly, not abstract it away with library debounce functions.

## Lessons Learned

1. Listen to the user's description of the *behavior* they want, not the technical term they use
2. Separate visual state from data state
3. Simple `setTimeout` patterns often beat library abstractions
4. When hiding content, always consider layout stability - measure real dimensions, don't hardcode
