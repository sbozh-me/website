"use client";

import { useEffect, useRef, useState } from "react";

import type { ReactNode } from "react";

interface PMDXScaleWrapperProps {
  children: ReactNode;
}

const A4_WIDTH_MM = 210;
const MM_TO_PX = 3.7795275591; // 1mm = 3.7795275591px at 96dpi
const A4_WIDTH_PX = A4_WIDTH_MM * MM_TO_PX;

export function PMDXScaleWrapper({ children }: PMDXScaleWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || !contentRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;

      if (containerWidth < A4_WIDTH_PX) {
        // Scale down to fit container
        const newScale = containerWidth / A4_WIDTH_PX;
        setScale(newScale);

        // Calculate scaled height to prevent empty space
        const contentHeight = contentRef.current.offsetHeight;
        setScaledHeight(contentHeight * newScale);
      } else {
        setScale(1);
        setScaledHeight(undefined);
      }
    };

    calculateScale();

    // Recalculate after fonts load
    const timer = setTimeout(calculateScale, 100);

    window.addEventListener("resize", calculateScale);
    return () => {
      window.removeEventListener("resize", calculateScale);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full not-prose my-8"
      style={{ height: scaledHeight }}
    >
      <div
        ref={contentRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: scale < 1 ? `${100 / scale}%` : "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}