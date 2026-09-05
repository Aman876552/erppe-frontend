import React from "react"
import { Badge } from "@/components/ui/badge"
import { StatusType } from "../types/common"

interface StatusBadgeProps {
  status: StatusType | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase()

  switch (normalized) {
    case "active":
    case "enabled":
    case "approved":
    case "completed":
      return <Badge variant="success" className={className}>Active</Badge>
    case "inactive":
    case "disabled":
    case "archived":
      return <Badge variant="secondary" className={className}>Inactive</Badge>
    case "suspended":
    case "blocked":
    case "rejected":
      return <Badge variant="destructive" className={className}>Suspended</Badge>
    case "pending":
    case "draft":
    case "processing":
      return <Badge variant="warning" className={className}>Pending</Badge>
    default:
      return <Badge variant="outline" className={className}>{status}</Badge>
  }
}
