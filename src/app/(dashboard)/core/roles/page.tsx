"use client"

import React, { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Role } from "@/modules/core/types/auth"
import { Shield, ShieldPlus, Users, Key, ChevronRight, Lock } from "lucide-react"

const MOCK_ROLES: Role[] = [
  {
    id: "role_1",
    name: "Super Administrator",
    code: "SUPER_ADMIN",
    description: "Unrestricted master access across all enterprise modules, configurations, and tenant settings.",
    isSystem: true,
    usersCount: 3,
    permissions: [{ id: "p1", code: "*", name: "All Permissions", module: "system" }],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "role_2",
    name: "System Administrator",
    code: "ADMIN",
    description: "Administrative access to user provisioning, role creation, and system module configurations.",
    isSystem: true,
    usersCount: 12,
    permissions: [
      { id: "p2", code: "users.manage", name: "Manage Users", module: "core" },
      { id: "p3", code: "roles.manage", name: "Manage Roles", module: "core" },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "role_3",
    name: "Department Manager",
    code: "MANAGER",
    description: "Operational management within specific departmental modules (Sales, Procurement, HR, Expenses).",
    isSystem: false,
    usersCount: 45,
    permissions: [
      { id: "p4", code: "sales.orders.manage", name: "Manage Sales Orders", module: "sales" },
      { id: "p5", code: "procurement.po.manage", name: "Manage POs", module: "procurement" },
    ],
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "role_4",
    name: "Standard User",
    code: "USER",
    description: "Read-only and standard workflow submission privileges for general employees.",
    isSystem: false,
    usersCount: 1180,
    permissions: [{ id: "p6", code: "dashboard.view", name: "View Dashboard", module: "core" }],
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "role_5",
    name: "Financial Auditor",
    code: "AUDITOR",
    description: "Compliance auditing access for reviewing system logs, financial vouchers, and audit trails.",
    isSystem: false,
    usersCount: 8,
    permissions: [
      { id: "p7", code: "audits.view", name: "View Audit Logs", module: "audits" },
      { id: "p8", code: "expenses.view", name: "View Expenses", module: "expenses" },
    ],
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
  },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDesc, setNewRoleDesc] = useState("")

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName) return

    const newRole: Role = {
      id: "role_" + Date.now(),
      name: newRoleName,
      code: "USER",
      description: newRoleDesc || "Custom security role",
      isSystem: false,
      usersCount: 0,
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setRoles([...roles, newRole])
    setNewRoleName("")
    setNewRoleDesc("")
    setIsAddRoleOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Roles Directory"
        description="Configure Role-Based Access Control (RBAC) roles and assign granular permission sets."
        actions={
          <Button onClick={() => setIsAddRoleOpen(true)} className="gap-2">
            <ShieldPlus className="h-4 w-4" /> Create Custom Role
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="flex flex-col justify-between hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <span className="text-[10px] font-mono text-muted-foreground">{role.code}</span>
                  </div>
                </div>
                {role.isSystem ? (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Lock className="h-3 w-3" /> System
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Custom
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-3 leading-relaxed">
                {role.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Users className="h-3.5 w-3.5 text-primary" /> Assigned Users
                </span>
                <span className="font-bold text-foreground">{role.usersCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Key className="h-3.5 w-3.5 text-amber-500" /> Granted Permissions
                </span>
                <span className="font-bold text-foreground">
                  {role.code === "SUPER_ADMIN" ? "All (*)" : `${role.permissions?.length || 0} Keys`}
                </span>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-4">
              <Button asChild variant="outline" size="sm" className="w-full justify-between">
                <Link href={`/core/roles/${role.id}`}>
                  <span>Edit Permission Matrix</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create Role Modal */}
      <Dialog
        open={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        title="Create New Security Role"
        description="Define a new role and customize its default permission matrix."
      >
        <form onSubmit={handleCreateRole} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Role Display Name</label>
            <Input
              placeholder="e.g. Warehouse Inventory Supervisor"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <Input
              placeholder="Brief summary of privileges..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Save & Edit Matrix
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
