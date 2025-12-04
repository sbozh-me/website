"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { compile } from "../runtime/compile";

import type { CompileOptions } from "../runtime/compile";
import type { ReactElement } from "react";

export interface UsePMDXJSOptions extends Omit<CompileOptions, "onError"> {
  /**
   * Debounce delay in milliseconds (default: 150)
   */
  debounce?: number;
}

export interface UsePMDXJSResult {
  /**
   * The compiled React element
   */
  element: ReactElement | null;
  /**
   * Whether compilation is in progress
   */
  loading: boolean;
  /**
   * Error if compilation failed
   */
  error: Error | null;
  /**
   * Manually trigger recompilation
   */
  recompile: () => void;
}

/**
 * React hook for compiling PMDXJS source to React elements
 *
 * Features:
 * - Automatic recompilation when source changes
 * - Debounced compilation to avoid excessive updates
 * - Loading and error states
 * - Manual recompile trigger
 *
 * @example
 * ```tsx
 * function Editor() {
 *   const [source, setSource] = useState(defaultCV);
 *   const { element, loading, error } = usePMDXJS(source);
 *
 *   return (
 *     <div className="flex">
 *       <textarea value={source} onChange={e => setSource(e.target.value)} />
 *       <div className="preview">
 *         {loading && <Spinner />}
 *         {error && <ErrorDisplay message={error.message} />}
 *         {element}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePMDXJS(
  source: string,
  options: UsePMDXJSOptions = {},
): UsePMDXJSResult {
  const { debounce = 150, ...compileOptions } = options;

  const [element, setElement] = useState<ReactElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const compileOptionsRef = useRef(compileOptions);
  compileOptionsRef.current = compileOptions;

  const doCompile = useCallback((src: string) => {
    const result = compile(src, compileOptionsRef.current);
    setElement(result.element);
    setError(result.error);
    setLoading(false);
  }, []);

  const recompile = useCallback(() => {
    setLoading(true);
    doCompile(source);
  }, [source, doCompile]);

  useEffect(() => {
    // Clear any pending debounced compilation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Initial compilation is immediate (no debounce)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      doCompile(source);
      return;
    }

    // Subsequent compilations are debounced
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      doCompile(source);
    }, debounce);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [source, debounce, doCompile]);

  return { element, loading, error, recompile };
}
