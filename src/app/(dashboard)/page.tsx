"use client"

import React from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/modules/core/hooks/use-auth"
import { useCrud } from "@/modules/core/hooks/use-crud"
import { User } from "@/modules/core/types/auth"
import { apiConfig } from "@/config/api"
import { ERP_MODULES } from "@/config/modules"
import {
  Users,
  ShieldCheck,
  Key,
  Activity,
  ArrowUpRight,
  UserPlus,
  Shield,
  Boxes,
  CheckCircle2,
  Clock,
} from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: users, meta, isLoading } = useCrud<User>({
    endpoint: apiConfig.endpoints.users.list,
  })

  const totalUsersCount = meta.totalItems || users.length
  const activeUsersCount = users.filter((u) => u.status === "active").length

  const metrics = [
    {
      title: "Total System Users",
      value: isLoading ? "..." : `${totalUsersCount} Accounts`,
      change: `${activeUsersCount} Active`,
      icon: <Users className="h-5 w-5 text-blue-500" />,
      href: "/core/users",
    },
    {
      title: "Active Security Roles",
      value: "5 Roles",
      change: "RBAC Enforced",
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
      href: "/core/roles",
    },
    {
      title: "System Permissions",
      value: "9 Keys",
      change: "Core Mapped",
      icon: <Key className="h-5 w-5 text-amber-500" />,
      href: "/core/permissions",
    },
    {
      title: "Active Core Modules",
      value: `${Object.values(ERP_MODULES).filter((m) => m.status === "active").length} Active`,
      change: "Core Kernel",
      icon: <Boxes className="h-5 w-5 text-indigo-500" />,
      href: "/core/users",
    },
  ]

  const dynamicLogs = users.slice(0, 4).map((u, index) => ({
    id: u.id,
    user: u.name,
    action: index === 0 ? "Active Session Verified" : index === 1 ? "Role Authorization Checked" : "User Profile Synced",
    target: `Department: ${u.department || "General"}`,
    time: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || "Administrator"}`}
        description="Executive Overview & Security Intelligence Hub for ERP Enterprise"
        badge={<Badge variant="success">Core Kernel Active</Badge>}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/core/roles">
                <Shield className="h-4 w-4" /> Roles Matrix
              </Link>
            </Button>
            <Button asChild variant="default" size="sm" className="gap-2">
              <Link href="/core/users">
                <UserPlus className="h-4 w-4" /> Manage Users
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, idx) => (
          <Link key={idx} href={m.href}>
            <Card className="hover:border-primary/50 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{m.title}</span>
                  <div className="rounded-xl bg-muted p-2">{m.icon}</div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-foreground">{m.value}</span>
                  <span className="text-xs font-medium text-emerald-500 flex items-center">
                    {m.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Module Health Matrix */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">System Module Registry</CardTitle>
              <CardDescription className="text-xs">Live deployment status across all domain modules</CardDescription>
            </div>
            <Badge variant="outline">User Module Focus</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(ERP_MODULES).map((mod) => (
              <div
                key={mod.key}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      mod.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {mod.status === "active" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{mod.name}</h4>
                    <p className="text-xs text-muted-foreground truncate max-w-sm">{mod.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {mod.status === "active" ? (
                    <Badge variant="success">Active</Badge>
                  ) : mod.status === "inactive" ? (
                    <Badge variant="secondary">Inactive</Badge>
                  ) : (
                    <Badge variant="warning">Coming Soon</Badge>
                  )}
                  <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                    <Link href={mod.path}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Audit Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Security Audit Log
            </CardTitle>
            <CardDescription className="text-xs">Real-time user & access events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dynamicLogs.map((log) => (
              <div key={log.id} className="flex flex-col space-y-1 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{log.action}</span>
                  <span className="text-[10px] text-muted-foreground">{log.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{log.target}</p>
                <span className="text-[10px] font-medium text-primary">By {log.user}</span>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full text-xs" size="sm">
              <Link href="/audits">View Full Audit Logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
