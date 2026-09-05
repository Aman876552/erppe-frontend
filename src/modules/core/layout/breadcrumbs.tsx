"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-muted-foreground mb-1">
      <Link href="/" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, idx) => {
        const url = `/${segments.slice(0, idx + 1).join("/")}`
        const isLast = idx === segments.length - 1
        const formatted = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())

        return (
          <React.Fragment key={url}>
            <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-foreground">{formatted}</span>
            ) : (
              <Link href={url} className="hover:text-foreground transition-colors">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
