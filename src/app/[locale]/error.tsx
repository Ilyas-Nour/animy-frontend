'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Next.js Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-4xl font-bold text-destructive">Something went wrong!</h1>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred while rendering this page.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Digest: {error.digest}</p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}
