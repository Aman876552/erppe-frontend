"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigationConfig } from "@/config/navigation"
import { ERP_MODULES } from "@/config/modules"
import { useUiStore } from "../stores/ui-store"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Boxes,
  ShoppingBag,
  Truck,
  Warehouse,
  Factory,
  Send,
  Briefcase,
  DoorOpen,
  Receipt,
  UserCheck,
  FileText,
  Activity,
  ShieldCheck,
  ChevronDown,
  Layers,
} from "lucide-react"

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  UserSquare2: <UserSquare2 className="h-4 w-4" />,
  Boxes: <Boxes className="h-4 w-4" />,
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  Truck: <Truck className="h-4 w-4" />,
  Warehouse: <Warehouse className="h-4 w-4" />,
  Factory: <Factory className="h-4 w-4" />,
  Send: <Send className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  DoorOpen: <DoorOpen className="h-4 w-4" />,
  Receipt: <Receipt className="h-4 w-4" />,
  UserCheck: <UserCheck className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
}

export function AppSidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed } = useUiStore()
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    "User Management": true,
  })

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 z-40 select-none shrink-0",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header / Brand Logo */}
      <div className="flex h-16 items-center border-b border-border px-4 justify-between">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg shadow-md shadow-blue-500/20">
            E
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-foreground text-sm leading-tight">ERP Enterprise</span>
              <span className="text-[10px] text-muted-foreground font-medium">Modular Platform v1.0</span>
            </div>
          )}
        </Link>
      </div>

      {/* Sidebar Content Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationConfig.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isSidebarCollapsed && (
              <h3 className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.items && item.items.some((sub) => pathname === sub.href))
                const hasChildren = item.items && item.items.length > 0
                const isOpen = openGroups[item.title]
                const icon = item.icon && iconMap[item.icon] ? iconMap[item.icon] : <Layers className="h-4 w-4" />
                const moduleMeta = item.moduleKey ? ERP_MODULES[item.moduleKey] : null
                const isInactive = moduleMeta && moduleMeta.status !== "active"

                return (
                  <div key={item.title}>
                    {hasChildren && !isSidebarCollapsed ? (
                      <div>
                        <button
                          onClick={() => toggleGroup(item.title)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? "text-primary" : "text-muted-foreground"}>{icon}</span>
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
                          />
                        </button>
                        {isOpen && (
                          <div className="mt-1 ml-4 pl-4 border-l border-border/60 space-y-1">
                            {item.items?.map((sub) => {
                              const isSubActive = pathname === sub.href
                              return (
                                <Link
                                  key={sub.title}
                                  href={sub.href}
                                  className={cn(
                                    "block rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    isSubActive
                                      ? "text-primary font-bold bg-primary/5"
                                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                  )}
                                >
                                  {sub.title}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        title={isSidebarCollapsed ? item.title : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-blue-500/20 font-semibold"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                          isSidebarCollapsed && "justify-center px-0"
                        )}
                      >
                        <span className={isActive ? "text-primary-foreground" : "text-muted-foreground"}>
                          {icon}
                        </span>
                        {!isSidebarCollapsed && (
                          <span className="flex-1 truncate">{item.title}</span>
                        )}
                        {!isSidebarCollapsed && item.badge && (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                            {item.badge}
                          </span>
                        )}
                        {!isSidebarCollapsed && isInactive && !item.badge && (
                          <span className="h-2 w-2 rounded-full bg-slate-400 opacity-60" />
                        )}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">User Management Active</p>
            <p className="mt-1 text-[11px]">All system security and RBAC hooks enabled.</p>
          </div>
        </div>
      )}
    </aside>
  )
}
