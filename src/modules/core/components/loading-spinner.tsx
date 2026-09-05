import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  label?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-7 w-7",
  lg: "h-11 w-11",
}

export function LoadingSpinner({ label = "Loading...", className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-muted-foreground", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {label && <p className="mt-2 text-sm font-medium">{label}</p>}
    </div>
  )
}
