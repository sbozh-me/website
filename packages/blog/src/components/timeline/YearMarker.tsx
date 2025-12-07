export interface YearMarkerProps {
  year: number;
}

export function YearMarker({ year }: YearMarkerProps) {
  return (
    <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 mt-12 mb-6 first:mt-0">
      {year}
    </h2>
  );
}
