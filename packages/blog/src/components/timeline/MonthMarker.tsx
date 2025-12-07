export interface MonthMarkerProps {
  month: string;
}

export function MonthMarker({ month }: MonthMarkerProps) {
  return (
    <h3 className="text-base font-semibold text-muted-foreground mt-8 mb-4 first:mt-0">
      {month}
    </h3>
  );
}
