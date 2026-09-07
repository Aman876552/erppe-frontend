"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { rolesApi, ApiRole } from "@/modules/core/lib/roles-api"
import { Shield, ShieldPlus, Users, Key, ChevronRight, Lock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

export default function RolesPage() {
  const [roles, setRoles] = useState<ApiRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchRoles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await rolesApi.getRoles()
      setRoles(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch security roles.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const createdRole = await rolesApi.createRole({
        name: newRoleName.trim(),
        guard_name: "sanctum",
      })

      setRoles((prev) => [...prev, createdRole])
      showNotification(`Role "${createdRole.name}" created successfully.`)
      setNewRoleName("")
      setIsAddRoleOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create role.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Roles Directory"
        description="Configure Role-Based Access Control (RBAC) roles and assign permission sets."
        badge={<Badge variant="info">RBAC Matrix</Badge>}
        actions={
          <div className="flex gap-2.5">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/core/permissions">
                <Key className="h-4 w-4 text-emerald-500" /> Open Permissions Matrix
              </Link>
            </Button>
            <Button onClick={() => setIsAddRoleOpen(true)} className="gap-2" size="sm">
              <ShieldPlus className="h-4 w-4" /> Create Custom Role
            </Button>
          </div>
        }
      />

      {/* Action Notification Banner */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading security roles...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id || role.code} className="flex flex-col justify-between hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{role.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{role.code || `ID: ${role.id}`}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                          {role.guard_name || "sanctum"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {role.isSystem ? (
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Lock className="h-3 w-3" /> System
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      Custom
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-3 leading-relaxed">
                  {role.description || "System security access role."}
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
                    {role.code === "SUPER_ADMIN" || role.permissions?.includes("*")
                      ? "All (*)"
                      : `${role.permissions?.length || 0} Keys`}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border pt-4 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 justify-between text-xs">
                  <Link href={`/core/roles/${role.id}`}>
                    <span>Edit Permissions</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Role Modal (ROLE NAME ONLY) */}
      <Dialog
        open={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        title="Add Designation & Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter role name (e.g. Editor)"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldPlus className="h-4 w-4 mr-1.5" />}
              Add Role
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
