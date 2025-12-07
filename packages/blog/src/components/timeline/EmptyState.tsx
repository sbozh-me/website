export interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "No posts found" }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
