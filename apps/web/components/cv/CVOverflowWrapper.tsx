"use client";

import { OverflowWarning } from "@sbozh/pmdxjs/components";

import type { ReactNode } from "react";

interface CVOverflowWrapperProps {
  children: ReactNode;
}

export function CVOverflowWrapper({ children }: CVOverflowWrapperProps) {
  return (
    <OverflowWarning enabled={process.env.NODE_ENV === "development"}>
      {children}
    </OverflowWarning>
  );
}
