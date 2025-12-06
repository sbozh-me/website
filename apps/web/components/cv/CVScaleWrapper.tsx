"use client";

import { useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

interface CVScaleWrapperProps {
  children: ReactNode;
}

const A4_WIDTH_MM = 210;
const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px at 96dpi
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;

export function CVScaleWrapper({ children }: CVScaleWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;

      if (containerWidth < A4_WIDTH_PX) {
        // Scale down to fit container
        setScale(containerWidth / A4_WIDTH_PX);
      } else {
        setScale(1);
      }
    };

    calculateScale();

    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, []);

  return (
    <div ref={containerRef} className="w-full print:!transform-none">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: scale < 1 ? `${100 / scale}%` : "100%",
        }}
        className="print:!transform-none print:!w-full"
      >
        {children}
      </div>
    </div>
  );
}
