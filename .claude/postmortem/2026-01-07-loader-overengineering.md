# Postmortem: Theme Loader Over-Engineering

**Date:** 2026-01-07
**Model comparison:** Claude Max (Opus 4.5) vs Paid Opus

## The Request

"Make a blocking loader - full page black screen with spinning logo. When fonts load, fade out."

## Claude Max Version (Over-engineered)

```tsx
interface ThemeLoaderOverlayProps {
  spinner: ReactNode;
  showDelay?: number;  // Why? Not asked for
}

export function ThemeLoaderOverlay({
  spinner,
  showDelay = 0,
}: ThemeLoaderOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(showDelay === 0);  // Extra state
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Handle show delay - feature creep
  useEffect(() => {
    if (showDelay > 0) {
      const timer = setTimeout(() => setShouldShow(true), showDelay);
      return () => clearTimeout(timer);
    }
  }, [showDelay]);

  useEffect(() => {
    const waitForFonts = async () => {
      try {
        await document.fonts.ready;
        await new Promise((resolve) => setTimeout(resolve, 50));  // Magic number
      } catch {
        // Fallback: continue anyway after timeout
      }
      setIsFadingOut(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 350);  // Another magic number
    };
    waitForFonts();
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-[#0d1117] transition-opacity
        ${isFadingOut ? "opacity-0 duration-150" : "opacity-100 duration-200"}
        ${shouldShow ? "visible" : "invisible"}
      `}
      style={{
        transitionTimingFunction: isFadingOut ? "ease-out" : "ease-in",
      }}
      aria-hidden="true"
    >
      <div
        className={`
          text-6xl animate-[spin_2s_linear_infinite]
          transition-opacity
          ${isFadingOut ? "opacity-0 duration-300" : "opacity-100 duration-200"}
        `}
        style={{
          transitionTimingFunction: isFadingOut ? "cubic-bezier(0.4, 0, 1, 1)" : "ease-in",
          transitionDelay: isFadingOut ? "50ms" : "0ms",
        }}
      >
        {spinner}
      </div>
    </div>
  );
}
```

**Problems:**
- 3 state variables when 2 suffice
- `showDelay` prop never requested
- Separate fade timings for background vs spinner (not asked for)
- Complex inline styles with cubic-bezier
- Magic numbers everywhere (50ms, 350ms, 150ms, 200ms, 300ms)
- JSDoc comments explaining animations nobody asked about

## Paid Opus Version (Clean)

```tsx
interface ThemeLoaderOverlayProps {
  spinner: ReactNode;
}

export function ThemeLoaderOverlay({ spinner }: ThemeLoaderOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 300);
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0d1117] transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      aria-hidden="true"
    >
      <div className="animate-spin" style={{ animationDuration: "2s" }}>
        {spinner}
      </div>
    </div>
  );
}
```

**Time to write:** 2 minutes
**Lines:** 24 vs 60+

## Key Differences

| Aspect | Claude Max | Paid Opus |
|--------|-----------|-----------|
| State variables | 3 | 2 |
| Props | 2 (with unrequested feature) | 1 |
| Effects | 2 | 1 |
| Magic numbers | 5+ | 1 |
| Lines of code | 60+ | 24 |
| Complexity | High | Minimal |

## Lesson

When asked to build X, build X. Not X with "nice to have" features, configurable delays, separate animation curves, and elaborate timing sequences.