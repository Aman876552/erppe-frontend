"use client"

import React from "react"
import { useAuth } from "../hooks/use-auth"
import { Avatar } from "@/components/ui/avatar"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { User as UserIcon, Settings, LogOut, Shield } from "lucide-react"

export function UserNav() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  const items = [
    {
      label: "My Profile",
      icon: <UserIcon className="h-4 w-4" />,
      onClick: () => router.push(`/core/users/${user.id}`),
    },
    {
      label: "Account Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => router.push(`/core/users/${user.id}`),
    },
    {
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4" />,
      divider: true,
      destructive: true,
      onClick: () => {
        logout()
        router.push("/login")
      },
    },
  ]

  const trigger = (
    <button className="flex items-center gap-3 rounded-full border border-border p-1 pr-3 hover:bg-accent transition-colors cursor-pointer text-left">
      <Avatar src={user.avatar} fallback={user.name} size="sm" />
      <div className="hidden md:flex flex-col text-left">
        <span className="text-xs font-semibold text-foreground leading-tight">{user.name}</span>
        <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-28">
          {user.roles?.[0]?.name || "User"}
        </span>
      </div>
    </button>
  )

  return <DropdownMenu trigger={trigger} items={items} align="right" />
}
