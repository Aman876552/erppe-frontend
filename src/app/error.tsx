"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Application Error</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {error.message || "An unexpected system exception occurred in the application layer."}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => reset()} variant="default" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    </div>
  )
}
