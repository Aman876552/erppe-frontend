import React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface ColumnHeaderProps {
  title: string
  sortable?: boolean
  sortOrder?: "asc" | "desc" | null
  onSort?: () => void
}

export function ColumnHeader({ title, sortable, sortOrder, onSort }: ColumnHeaderProps) {
  if (!sortable) {
    return <span className="font-semibold text-muted-foreground">{title}</span>
  }

  return (
    <button
      onClick={onSort}
      className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      {title}
      {sortOrder === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5 text-primary" />
      ) : sortOrder === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5 text-primary" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  )
}
