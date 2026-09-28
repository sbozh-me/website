interface ArrowIconProps {
  direction: "previous" | "next";
  className?: string;
}

export function ArrowIcon({ direction, className = "size-4" }: ArrowIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {direction === "previous" ? (
        <path d="M19 12H5M12 19l-7-7 7-7" />
      ) : (
        <path d="M5 12h14M12 5l7 7-7 7" />
      )}
    </svg>
  );
}
