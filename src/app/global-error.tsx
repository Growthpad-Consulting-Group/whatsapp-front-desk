"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="block mt-1 font-mono text-xs text-gray-400">
                Ref: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
