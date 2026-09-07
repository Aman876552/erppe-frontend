"use client"

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog } from "@/components/ui/dialog"
import { rolesApi, ApiRole, ApiPermission } from "@/modules/core/lib/roles-api"
import {
  Shield,
  ShieldPlus,
  Key,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react"

export default function PermissionsPage() {
  const [roles, setRoles] = useState<ApiRole[]>([])
  const [permissions, setPermissions] = useState<ApiPermission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // Modal 1: Add Designation & Role (Role Name ONLY)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isSubmittingRole, setIsSubmittingRole] = useState(false)

  // Modal 2: Add Permission (Permission Name ONLY)
  const [isAddPermOpen, setIsAddPermOpen] = useState(false)
  const [newPermName, setNewPermName] = useState("")
  const [isSubmittingPerm, setIsSubmittingPerm] = useState(false)

  // Track permissions per role ID (roleId -> array of permission strings)
  const [rolePermissionsState, setRolePermissionsState] = useState<Record<string | number, string[]>>({})
  
  // Track roles that have modified permissions needing update
  const [dirtyRoleIds, setDirtyRoleIds] = useState<Set<string | number>>(new Set())

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [fetchedRoles, fetchedPerms] = await Promise.all([
        rolesApi.getRoles(),
        rolesApi.getPermissions(),
      ])

      setRoles(fetchedRoles)
      setPermissions(fetchedPerms)

      // Initialize state mapping roleId -> array of permission names
      const initialState: Record<string | number, string[]> = {}
      fetchedRoles.forEach((role) => {
        initialState[role.id] = (role.permissions || []).map((p) =>
          typeof p === "string" ? p : p.name || p.code || String(p)
        )
      })
      setRolePermissionsState(initialState)
      setDirtyRoleIds(new Set())
    } catch (err: any) {
      setError(err.message || "Failed to load roles and permissions matrix.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle select or unselect checkbox for permission (Local state change only, no API call until Update button clicked)
  const handleTogglePermission = (role: ApiRole, permCode: string) => {
    const roleId = role.id
    setRolePermissionsState((prev) => {
      const currentPerms = prev[roleId] || []
      const isGranted = currentPerms.includes(permCode)
      const updated = isGranted
        ? currentPerms.filter((p) => p !== permCode)
        : [...currentPerms, permCode]
      return {
        ...prev,
        [roleId]: updated,
      }
    })

    // Mark role as modified
    setDirtyRoleIds((prev) => new Set(prev).add(roleId))
  }

  // Save all modified role permissions via PUT /api/role/updatepermissions/{id}
  const handleUpdateAllPermissions = async () => {
    if (dirtyRoleIds.size === 0) return

    setIsSaving(true)
    setError(null)

    try {
      const updatePromises = Array.from(dirtyRoleIds).map(async (roleId) => {
        const roleObj = roles.find((r) => String(r.id) === String(roleId))
        const permsToSave = rolePermissionsState[roleId] || []
        await rolesApi.updateRolePermissions(roleId, permsToSave, roleObj?.name)
      })

      await Promise.all(updatePromises)

      setDirtyRoleIds(new Set())
      showNotification("Role permissions updated successfully.")
    } catch (err: any) {
      setError(err.message || "Failed to update role permissions.")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Create Role: POST /api/roles { name: "Editor", guard_name: "sanctum" }
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) return

    setIsSubmittingRole(true)
    setError(null)
    try {
      const createdRole = await rolesApi.createRole({
        name: newRoleName.trim(),
        guard_name: "sanctum",
      })

      setRoles((prev) => [...prev, createdRole])
      setRolePermissionsState((prev) => ({
        ...prev,
        [createdRole.id]: createdRole.permissions.map((p) =>
          typeof p === "string" ? p : p.name || p.code || String(p)
        ),
      }))

      showNotification(`Role "${createdRole.name}" created successfully.`)
      setNewRoleName("")
      setIsAddRoleOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create role.")
    } finally {
      setIsSubmittingRole(false)
    }
  }

  // Handle Create Permission: POST /api/permissions { name: "users.view", guard_name: "sanctum" }
  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPermName.trim()) return

    setIsSubmittingPerm(true)
    setError(null)
    try {
      const createdPerm = await rolesApi.createPermission({
        name: newPermName.trim(),
        guard_name: "sanctum",
        module: "General",
      })

      setPermissions((prev) => [...prev, createdPerm])
      showNotification(`Permission "${createdPerm.name}" created successfully.`)
      setNewPermName("")
      setIsAddPermOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create permission.")
    } finally {
      setIsSubmittingPerm(false)
    }
  }

  // Filter permissions by search query
  const filteredPermissions = permissions.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.module || "").toLowerCase().includes(search.toLowerCase())
  )

  // Group permissions by module
  const groupedPermissions: Record<string, ApiPermission[]> = {}
  filteredPermissions.forEach((p) => {
    const mod = p.module || "General"
    if (!groupedPermissions[mod]) {
      groupedPermissions[mod] = []
    }
    groupedPermissions[mod].push(p)
  })

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <PageHeader
        title="Permissions Matrix"
        description="Pick a role, tick its permissions, save. Changes apply immediately."
        badge={<Badge variant="info">RBAC Matrix</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsAddRoleOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 bg-card hover:bg-accent border-border font-medium"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>+ Add Designations & Roles</span>
            </Button>

            <Button
              onClick={() => setIsAddPermOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2 bg-card hover:bg-accent border-border font-medium"
            >
              <Plus className="h-4 w-4 text-emerald-500" />
              <span>+ Add Permission</span>
            </Button>

            <Button
              onClick={loadData}
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <Card className="border border-border/60 bg-card shadow-xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Assign Permissions to Roles</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Manage permissions across all roles.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="Quick Select / Filter Permission..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="h-3.5 w-3.5 text-muted-foreground" />}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Loading Permissions Matrix...</span>
              </div>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30">
                    <th className="p-3.5 pl-5 font-bold uppercase tracking-wider text-[11px] text-muted-foreground sticky left-0 z-20 bg-muted/90 backdrop-blur-xs min-w-[220px]">
                      PERMISSION
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-foreground text-center min-w-[150px] border-l border-border/40"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{role.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {Object.keys(groupedPermissions).length === 0 ? (
                    <tr>
                      <td
                        colSpan={roles.length + 1}
                        className="p-8 text-center text-xs text-muted-foreground"
                      >
                        No permissions matching "{search}".
                      </td>
                    </tr>
                  ) : (
                    Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                      <React.Fragment key={moduleName}>
                        {/* Module Section Header Row */}
                        <tr className="bg-muted/40 font-semibold text-[11px] text-foreground tracking-wider uppercase">
                          <td
                            colSpan={roles.length + 1}
                            className="p-2.5 pl-5 border-y border-border/60 bg-muted/60 sticky left-0 z-10"
                          >
                            <span className="text-primary font-bold">{moduleName}</span>
                          </td>
                        </tr>

                        {/* Module Permission Rows */}
                        {modulePerms.map((perm) => {
                          const permCode = perm.name || perm.code || String(perm.id)

                          return (
                            <tr
                              key={permCode}
                              className="hover:bg-muted/30 transition-colors group"
                            >
                              {/* Sticky Permission Name */}
                              <td className="p-3 pl-5 font-mono text-xs text-foreground/90 font-medium sticky left-0 z-10 bg-card group-hover:bg-muted/30 border-r border-border/40">
                                <span className="font-mono text-xs text-foreground font-semibold">
                                  {permCode}
                                </span>
                              </td>

                              {/* Checkbox cell for each Role */}
                              {roles.map((role) => {
                                const currentPerms = rolePermissionsState[role.id] || []
                                const isSuperAdmin = role.code === "SUPER_ADMIN" || role.name.toLowerCase().includes("super admin")
                                const isChecked = isSuperAdmin || currentPerms.includes("*") || currentPerms.includes(permCode)

                                return (
                                  <td
                                    key={role.id}
                                    className="p-3 text-center align-middle border-r border-border/30 hover:bg-primary/5 transition-colors cursor-pointer select-none"
                                    onClick={() => !isSuperAdmin && handleTogglePermission(role, permCode)}
                                  >
                                    <div className="flex items-center justify-center pointer-events-none">
                                      <Checkbox
                                        checked={isChecked}
                                        disabled={isSuperAdmin}
                                        onChange={() => {}}
                                      />
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Permissions Button Bar (Appears when checkboxes are selected/unselected) */}
      {dirtyRoleIds.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 p-4 rounded-2xl bg-card border border-primary/40 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="text-xs font-semibold text-foreground">
              Permission changes detected ({dirtyRoleIds.size} role{dirtyRoleIds.size > 1 ? "s" : ""})
            </span>
          </div>

          <Button
            onClick={handleUpdateAllPermissions}
            disabled={isSaving}
            size="sm"
            className="gap-2 font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Update Permissions</span>
          </Button>
        </div>
      )}

      {/* Modal 1: Add Designation & Role (ROLE NAME ONLY) */}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddRoleOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingRole}>
              {isSubmittingRole ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <ShieldPlus className="h-4 w-4 mr-1.5" />
              )}
              Add Role
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Add Permission (PERMISSION NAME ONLY) */}
      <Dialog
        open={isAddPermOpen}
        onClose={() => setIsAddPermOpen(false)}
        title="Add Permission"
      >
        <form onSubmit={handleCreatePermission} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Permission Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter permission name (e.g. users.view)"
              value={newPermName}
              onChange={(e) => setNewPermName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddPermOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingPerm}>
              {isSubmittingPerm ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Key className="h-4 w-4 mr-1.5" />
              )}
              Add Permission
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
