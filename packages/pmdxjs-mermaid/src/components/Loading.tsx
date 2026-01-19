/**
 * Default loading component for Mermaid diagrams
 */
export function Loading() {
  return (
    <div className="pmdxjs-mermaid-loading flex items-center justify-center p-4 bg-muted/30 rounded animate-pulse">
      <div className="text-muted-foreground text-sm">Loading diagram...</div>
    </div>
  );
}
