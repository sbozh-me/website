# Postmortem: Falling Stars Animation Performance

**Date:** 2026-01-14
**Component:** AuthorCarousel falling stars easter egg
**Severity:** UX degradation (laggy animations)
**Status:** Resolved

## Summary

The falling stars animation in the AuthorCarousel component caused significant lag and jank when users rapidly clicked through authors. The animation was implemented using React state and framer-motion, which introduced unnecessary overhead for a purely visual effect.

## Timeline

1. **Initial implementation:** Stars stored in React state (`useState<FallingStar[]>`)
2. **Animation:** Each star rendered as `<motion.div>` with framer-motion
3. **Cleanup:** `onAnimationComplete` callback triggered `setStars()` to remove finished stars
4. **Problem observed:** Noticeable lag during rapid clicking, especially with multiple stars

## Root Cause

The implementation violated a key React performance principle: **Don't use React state for things that don't need to trigger re-renders of other components.**

### Problems with the original approach:

1. **State updates per star:** Each star spawn called `setStars(prev => [...prev, newStar])`
2. **State updates on removal:** Each completed animation called `setStars(prev => prev.filter(...))`
3. **Reconciliation overhead:** React had to diff the entire stars array on every update
4. **framer-motion overhead:** AnimatePresence tracked enter/exit states for each star
5. **Re-renders cascade:** Parent component re-rendered on every star state change

### The math was brutal:

- 5 clicks → 2 stars spawned each → 10 stars
- Each star: 1 spawn update + 1 removal update = 2 state updates
- 10 stars × 2 updates = 20 `setStars()` calls
- Each call: array copy + filter/spread + React reconciliation + framer-motion diffing

## Solution

Rewrote the star animation using **native JavaScript DOM manipulation**:

```typescript
function spawnNativeStar(container: HTMLDivElement) {
  const star = document.createElement("img")
  // ... set styles
  container.appendChild(star)

  // Animate with requestAnimationFrame
  function animate(currentTime: number) {
    // ... calculate position
    star.style.transform = `translateY(${y}vh) rotate(${rot}deg) scale(${scale})`

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      star.remove() // Direct DOM removal, no React involved
    }
  }

  requestAnimationFrame(animate)
}
```

### Why this works:

1. **Zero React state:** No `useState`, no re-renders
2. **Zero reconciliation:** React doesn't know about these elements
3. **Direct DOM:** `createElement`, `appendChild`, `remove()` are O(1) operations
4. **requestAnimationFrame:** Browser-optimized 60fps animation loop
5. **will-change: transform:** GPU-accelerated compositing
6. **Self-cleaning:** Each star removes itself when done

## Lessons Learned

### When to use React state:
- Data that affects what users see in React components
- Data that needs to persist across renders
- Data that other components depend on

### When NOT to use React state:
- Purely decorative animations that don't affect layout
- Temporary visual effects (particles, confetti, etc.)
- High-frequency updates (mouse position, scroll, etc.)
- Elements that can manage their own lifecycle

### The rule:
> If an element's lifecycle is completely independent and doesn't need to communicate with React, don't let React manage it.

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| State updates per star | 2 | 0 |
| React re-renders | Many | 0 |
| Animation smoothness | Laggy | 60fps |
| Memory churn | High (array copies) | Low (direct DOM) |

## Prevention

For future particle/decoration effects:

1. **Ask:** Does this need to affect React state?
2. **If no:** Use native DOM + requestAnimationFrame
3. **If yes:** Consider `useRef` to store mutable data without re-renders
4. **Never:** Use `useState` for arrays of animated elements that update frequently

## References

- [React docs on when to use state](https://react.dev/learn/state-a-components-memory)
- [requestAnimationFrame for animations](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [CSS will-change property](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
