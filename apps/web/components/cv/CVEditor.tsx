"use client";

import { useState } from "react";

import { compile } from "@sbozh/pmdxjs";
import { OverflowWarning } from "@sbozh/pmdxjs/components";

interface CVEditorProps {
  initialSource: string;
}

export function CVEditor({ initialSource }: CVEditorProps) {
  const [source, setSource] = useState(initialSource);
  const { element, error } = compile(source);

  return (
    <div className="grid grid-cols-2 gap-6 print:block">
      {/* Editor Panel */}
      <div className="print:hidden">
        <div className="sticky top-6">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            PMDX Source
          </label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full h-[calc(100vh-180px)] p-4 font-mono text-sm bg-muted/30 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Preview Panel */}
      <div className="print:w-full">
        <label className="block text-sm font-medium text-muted-foreground mb-2 print:hidden">
          Preview
        </label>
        <OverflowWarning enabled={process.env.NODE_ENV === "development"}>
          {error ? (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-destructive font-medium">Parse Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error.message}</p>
            </div>
          ) : (
            <div className="cv-container">{element}</div>
          )}
        </OverflowWarning>
      </div>
    </div>
  );
}
