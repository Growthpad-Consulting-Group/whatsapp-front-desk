"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <p className="text-3xl mb-4">😕</p>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Failed to load this page
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Something went wrong loading your data. This is usually temporary.
        {error.digest && (
          <span className="block mt-1 font-mono text-xs text-muted-foreground/70">
            Ref: {error.digest}
          </span>
        )}
      </p>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
