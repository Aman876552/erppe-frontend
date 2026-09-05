"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigationConfig } from "@/config/navigation"
import { useUiStore } from "../stores/ui-store"
import { X, Layers } from "lucide-react"

export function MobileSidebar() {
  const pathname = usePathname()
  const { isMobileMenuOpen, setMobileMenuOpen } = useUiStore()

  if (!isMobileMenuOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer */}
      <div className="relative z-50 flex w-72 max-w-[80vw] flex-col bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-base">
              E
            </div>
            <span className="font-bold text-foreground text-sm">ERP Enterprise</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navigationConfig.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
