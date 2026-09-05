"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/modules/core/components/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { Shield, Key, Mail, Building, Calendar, ShieldCheck, ArrowLeft, Lock } from "lucide-react"

export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [activeTab, setActiveTab] = useState("overview")

  const mockUserDetail = {
    id: userId,
    name: "Alexander Wright",
    email: "alexander.wright@enterprise.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    department: "System Administration",
    designation: "Enterprise Security Lead",
    status: "active",
    roles: [
      {
        id: "r1",
        name: "Super Administrator",
        code: "SUPER_ADMIN",
        description: "Full unhindered access across all enterprise system modules and settings.",
      },
    ],
    permissions: [
      "users.create",
      "users.view",
      "users.edit",
      "users.delete",
      "roles.manage",
      "audits.view",
      "system.config",
    ],
    lastLoginAt: "2026-09-04 12:00:00 UTC",
    createdAt: "2026-01-15 08:30:00 UTC",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mockUserDetail.name}
        description={`User Profile & Security Access Inspector (ID: ${userId})`}
        badge={<StatusBadge status={mockUserDetail.status} />}
        actions={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/core/users">
              <ArrowLeft className="h-4 w-4" /> Back to Users Directory
            </Link>
          </Button>
        }
      />

      {/* Profile Banner Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar src={mockUserDetail.avatar} fallback={mockUserDetail.name} size="xl" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{mockUserDetail.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {mockUserDetail.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-primary" /> {mockUserDetail.department}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Joined {mockUserDetail.createdAt}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Lock className="h-4 w-4 text-amber-500" /> Force Password Reset
              </Button>
              <Button variant="default" size="sm" className="gap-2">
                <Shield className="h-4 w-4" /> Edit Role Assignment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigator */}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview & Roles", icon: <ShieldCheck className="h-4 w-4" /> },
          { id: "permissions", label: "Direct Permissions Matrix", icon: <Key className="h-4 w-4" />, badge: mockUserDetail.permissions.length },
          { id: "audit", label: "Security Activity Log", icon: <Lock className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Security Roles</CardTitle>
              <CardDescription className="text-xs">Active roles governing system access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockUserDetail.roles.map((role) => (
                <div key={role.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{role.name}</span>
                    <Badge variant="default" className="text-[10px]">
                      {role.code}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session & Security Status</CardTitle>
              <CardDescription className="text-xs">Real-time authentication metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Last Successful Login</span>
                <span className="font-semibold text-foreground">{mockUserDetail.lastLoginAt}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">MFA Authentication</span>
                <Badge variant="success">Enforced & Active</Badge>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Account Status</span>
                <StatusBadge status={mockUserDetail.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "permissions" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Direct Permissions Matrix</CardTitle>
            <CardDescription className="text-xs">
              List of granular permission keys granted directly or inherited via roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockUserDetail.permissions.map((p) => (
                <Badge key={p} variant="outline" className="font-mono text-xs py-1.5 px-3 bg-muted/50 border-primary/30 text-foreground">
                  <Key className="h-3 w-3 mr-1.5 text-primary" /> {p}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "audit" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Activity Audit Trail</CardTitle>
            <CardDescription className="text-xs">Recent security actions logged for this user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { event: "User Logged In", ip: "192.168.1.104", time: "2026-09-04 12:00:00 UTC" },
              { event: "Role Granted: Super Admin", ip: "192.168.1.1", time: "2026-09-01 10:30:00 UTC" },
              { event: "MFA Token Verified", ip: "192.168.1.104", time: "2026-09-01 10:29:00 UTC" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                <div>
                  <span className="font-semibold text-foreground">{log.event}</span>
                  <span className="ml-3 font-mono text-muted-foreground">IP: {log.ip}</span>
                </div>
                <span className="text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
