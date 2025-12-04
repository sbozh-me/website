import { parse } from "../parser";
import { transform } from "../transformer";

import type { TransformOptions } from "../transformer";
import type { ReactElement } from "react";

export interface CompileOptions extends TransformOptions {
  /**
   * Called when compilation fails
   */
  onError?: (error: Error) => void;
}

export interface CompileResult {
  /**
   * The compiled React element, or null if compilation failed
   */
  element: ReactElement | null;
  /**
   * Error if compilation failed
   */
  error: Error | null;
}

/**
 * Compile PMDXJS source to React element
 *
 * This is the core compilation function used by both browser and server.
 * It parses the source and transforms it to a React element.
 */
export function compile(
  source: string,
  options: CompileOptions = {},
): CompileResult {
  const { onError, ...transformOptions } = options;

  try {
    const ast = parse(source);
    const element = transform(ast, transformOptions);
    return { element, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
    return { element: null, error };
  }
}

/**
 * Compile PMDXJS source to React element (async version)
 *
 * Useful for browser environments where you might want to
 * debounce or defer compilation.
 */
export async function compileAsync(
  source: string,
  options: CompileOptions = {},
): Promise<CompileResult> {
  return new Promise((resolve) => {
    // Use setTimeout to allow for UI updates between compilations
    setTimeout(() => {
      resolve(compile(source, options));
    }, 0);
  });
}
