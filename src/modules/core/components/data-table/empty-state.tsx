import React from "react"
import { EmptyState } from "../empty-state"
import { SearchX } from "lucide-react"

export function DataTableEmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="py-12">
      <EmptyState
        icon={<SearchX className="h-7 w-7 text-muted-foreground" />}
        title="No Matching Records"
        description="No results were found matching your active search or filter parameters. Try adjusting your query."
        actionLabel={onClear ? "Clear Filters" : undefined}
        onAction={onClear}
      />
    </div>
  )
}
