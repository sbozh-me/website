import { readFileSync } from "fs";
import { join } from "path";

import { compile } from "@sbozh/pmdxjs";

import { CVOverflowWrapper, CVPrintButton } from "@/components/cv";

function getCV() {
  const cvPath = join(process.cwd(), "content", "cv.pmdx");
  return readFileSync(cvPath, "utf-8");
}

export default function CVPage() {
  const source = getCV();
  const { element, error } = compile(source);

  if (error) {
    return (
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="tracking-tight text-destructive">Error</h1>
          <p className="mt-4 text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 print:p-0">
      <div className="flex justify-end mb-6 print:hidden">
        <CVPrintButton />
      </div>
      <CVOverflowWrapper>
        <div className="cv-container">{element}</div>
      </CVOverflowWrapper>
    </div>
  );
}
