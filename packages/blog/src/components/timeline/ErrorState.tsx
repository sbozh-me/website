export interface ErrorStateProps {
  title?: string;
  message?: string;
  status?: number;
}

export function ErrorState({
  title = "Unable to load posts",
  message = "There was a problem connecting to the content server.",
  status,
}: ErrorStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mb-4">
        <svg
          className="w-6 h-6 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
      {status && (
        <p className="text-sm text-muted-foreground mt-2">
          Status: <code className="bg-muted px-1.5 py-0.5 rounded">{status}</code>
        </p>
      )}
    </div>
  );
}
