export type StatusType = "active" | "inactive" | "suspended" | "pending" | "archived"

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
  description?: string
}

export interface TableColumn<T> {
  key: string
  title: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export interface MetricCardData {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
  icon: string
  description?: string
}
