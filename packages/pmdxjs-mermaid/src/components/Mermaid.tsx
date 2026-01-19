"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

import { MermaidError as DefaultError } from "./Error";
import { Loading as DefaultLoading } from "./Loading";

import type { MermaidComponentProps } from "../types";

/**
 * Mermaid diagram component with async rendering
 *
 * This component is client-only and uses useEffect for rendering
 * to avoid SSR issues with mermaid's DOM requirements.
 */
export function Mermaid({
  content,
  className,
  options,
}: MermaidComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const id = useId().replace(/:/g, "_");

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: options?.theme ?? "dark",
          ...options?.mermaidConfig,
        });

        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${id}`,
          content,
        );

        if (!cancelled) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [content, id, options]);

  if (loading) {
    const LoadingComponent = options?.LoadingComponent ?? DefaultLoading;
    return <LoadingComponent />;
  }

  if (error) {
    const ErrorComponent = options?.ErrorComponent ?? DefaultError;
    return <ErrorComponent error={error} />;
  }

  return (
    <div
      ref={containerRef}
      className={`pmdxjs-mermaid ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
