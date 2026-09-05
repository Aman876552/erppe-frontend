"use client"

import React, { useState } from "react"
import { Bell, CheckCircle2, AlertCircle, Info, ShieldAlert } from "lucide-react"
import { useUiStore } from "../stores/ui-store"

export function NotificationBell() {
  const { activeNotificationsCount, setNotificationsCount } = useUiStore()
  const [isOpen, setIsOpen] = useState(false)

  const notifications = [
    {
      id: "1",
      title: "New Role Assigned",
      time: "10 mins ago",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      text: "You were granted Super Administrator permissions.",
    },
    {
      id: "2",
      title: "Security Audit Triggered",
      time: "1 hour ago",
      icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
      text: "System security scan completed with 0 critical issues.",
    },
    {
      id: "3",
      title: "Module Status Update",
      time: "3 hours ago",
      icon: <Info className="h-4 w-4 text-blue-500" />,
      text: "User & Security core module is operating at full health.",
    },
  ]

  const handleClear = () => {
    setNotificationsCount(0)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {activeNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
            {activeNotificationsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in-80 zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            {activeNotificationsCount > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-primary hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="mt-3 space-y-3 max-h-72 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5 shrink-0">{n.icon}</div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{n.time}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground leading-snug">{n.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
