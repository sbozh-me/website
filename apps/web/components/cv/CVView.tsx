import { readFileSync } from "fs";
import { join } from "path";

import { compile } from "@sbozh/pmdxjs";

import { CVDownloadButton } from "./CVDownloadButton";
import { CVOverflowWrapper } from "./CVOverflowWrapper";
import { CVPrintButton } from "./CVPrintButton";
import { CVScaleWrapper } from "./CVScaleWrapper";
import { CVThemeToggle } from "./CVThemeToggle";

interface CVViewProps {
  /** File name inside apps/web/content */
  file: string;
  title: string;
  pdfUrl?: string;
  pdfFilename?: string;
}

export function CVView({ file, title, pdfUrl, pdfFilename }: CVViewProps) {
  const source = readFileSync(join(process.cwd(), "content", file), "utf-8");
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
    <div className="mx-auto px-4 md:px-12 lg:px-24 py-6 md:py-12 print:p-0">
      <h2 className="text-center print:hidden">{title}</h2>
      <div className="flex justify-center print:hidden z-10 flex gap-2 p-4 py-8 px-8">
        <CVThemeToggle />
        <CVPrintButton />
        <CVDownloadButton url={pdfUrl} filename={pdfFilename} />
      </div>
      <CVScaleWrapper>
        <CVOverflowWrapper>
          <div className="cv-container">
            {element}
          </div>
        </CVOverflowWrapper>
      </CVScaleWrapper>
    </div>
  );
}
