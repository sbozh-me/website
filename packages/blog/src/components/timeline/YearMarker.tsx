export interface YearMarkerProps {
  year: number;
}

export function YearMarker({ year }: YearMarkerProps) {
  return (
    <h2 className="text-xl md:text-2xl font-bold text-foreground border-b border-border pb-2 mt-8 md:mt-12 mb-4 md:mb-6 first:mt-0">
      {year}
    </h2>
  );
}
