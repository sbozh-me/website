"use client";

import { Button } from "@sbozh/react-ui/components/ui/button";

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function LoadMoreButton({ onClick, isLoading }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center pt-8">
      <Button
        variant="outline"
        onClick={onClick}
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Load More"}
      </Button>
    </div>
  );
}
