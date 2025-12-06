"use client";

import { Button } from "@sbozh/react-ui/components/ui/button";

export function CVPrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} aria-label="Print CV">
      <PrintIcon />
      Print
    </Button>
  );
}

function PrintIcon() {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="6 9 6 2 18 2 18 9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <rect width="12" height="8" x="6" y="14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
