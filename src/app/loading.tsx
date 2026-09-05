import React from "react"
import { LoadingSpinner } from "@/modules/core/components/loading-spinner"

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner label="Loading ERP Application..." size="lg" />
    </div>
  )
}
