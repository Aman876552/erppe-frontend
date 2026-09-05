"use client"

import React from "react"
import { useUiStore } from "../stores/ui-store"
import { useThemeStore } from "../stores/theme-store"
import { UserNav } from "./user-nav"
import { NotificationBell } from "./notification-bell"
import { Menu, PanelLeftClose, PanelLeftOpen, Sun, Moon, Search } from "lucide-react"

export function AppHeader() {
  const { isSidebarCollapsed, toggleSidebar, toggleMobileMenu } = useUiStore()
  const { theme, setTheme } = useThemeStore()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Global Quick Search trigger */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-input bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground w-64">
          <Search className="h-3.5 w-3.5" />
          <span>Quick search (Ctrl + K)</span>
          <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono font-medium text-foreground">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        <div className="h-6 w-px bg-border mx-1" />

        {/* User Navigation Dropdown */}
        <UserNav />
      </div>
    </header>
  )
}
