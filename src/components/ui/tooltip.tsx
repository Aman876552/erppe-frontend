import * as React from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = React.useState(false)

  const posClasses = {
    top: "-top-8 left-1/2 -translate-x-1/2",
    bottom: "-bottom-8 left-1/2 -translate-x-1/2",
    left: "top-1/2 -left-2 -translate-x-full -translate-y-1/2",
    right: "top-1/2 -right-2 translate-x-full -translate-y-1/2",
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-md animate-in fade-in duration-150 dark:bg-slate-100 dark:text-slate-900 font-medium",
            posClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
