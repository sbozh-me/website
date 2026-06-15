"use client";

import { cn } from "../../lib/utils";

export interface TotalProps {
  label?: string;
  amount: string;
  className?: string;
}

/**
 * Prominent amount-due bar (Celkem k úhradě).
 */
export function Total({
  label = "Celkem k úhradě",
  amount,
  className,
}: TotalProps) {
  return (
    <div className={cn("pmdxjs-total", className)}>
      <span className="pmdxjs-total-label">{label}</span>
      <span className="pmdxjs-total-value">{amount}</span>
    </div>
  );
}
