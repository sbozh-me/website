export interface PersonaDotProps {
  color: string;
  name: string;
  showName?: boolean;
}

export function PersonaDot({ color, name, showName = false }: PersonaDotProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {showName && (
        <span className="text-sm font-medium" style={{ color }}>
          {name}
        </span>
      )}
    </span>
  );
}
