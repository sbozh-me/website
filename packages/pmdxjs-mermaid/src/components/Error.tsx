/**
 * Default error component for Mermaid diagrams
 */
export function MermaidError({ error }: { error: globalThis.Error }) {
  return (
    <div className="pmdxjs-mermaid-error p-4 bg-destructive/10 border border-destructive/20 rounded">
      <div className="text-destructive text-sm font-medium">
        Failed to render diagram
      </div>
      <div className="text-destructive/80 text-xs mt-1">{error.message}</div>
    </div>
  );
}
