"use client";

import { cn } from "../../lib/utils";

export interface SignProps {
  name?: string;
  /** Optional signature image URL drawn above the signing line. */
  image?: string;
  className?: string;
}

/**
 * Signature block — an optional signature image above a ruled line with the
 * issuer's name.
 */
export function Sign({ name, image, className }: SignProps) {
  return (
    <div className={cn("pmdxjs-sign", className)}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pmdxjs-sign-img" src={image} alt="Podpis" />
      )}
      <div className="pmdxjs-sign-line">
        <span className="pmdxjs-sign-label">Podpis</span>
      </div>
      {name && <div className="pmdxjs-sign-name">{name}</div>}
    </div>
  );
}
