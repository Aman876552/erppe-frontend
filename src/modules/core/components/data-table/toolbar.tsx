import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectOption } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToolbarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  filterOption?: string
  onFilterChange?: (value: string) => void
  filterOptions?: SelectOption[]
  filterPlaceholder?: string
  actions?: React.ReactNode
}

export function Toolbar({
  searchQuery = "",
  onSearchChange,
  filterOption = "",
  onFilterChange,
  filterOptions,
  filterPlaceholder = "All Statuses",
  actions,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filterOptions && onFilterChange && (
          <div className="w-full sm:w-44">
            <Select
              value={filterOption}
              onChange={(e) => onFilterChange(e.target.value)}
              options={[{ label: filterPlaceholder, value: "" }, ...filterOptions]}
            />
          </div>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
