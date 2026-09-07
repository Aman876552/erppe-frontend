"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/modules/core/components/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { Dialog } from "@/components/ui/dialog"
import { usersApi, User } from "@/modules/core/lib/users-api"
import { rolesApi, Role } from "@/modules/core/lib/roles-api"
import {
  Shield,
  Key,
  Mail,
  Building,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Loader2,
} from "lucide-react"

export default function UserDetailPage() {
  const params = useParams()
  const userId = (params?.id as string) || ""

  const [user, setUser] = useState<User | null>(null)
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Role Assignment Dialog
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [selectedRoleName, setSelectedRoleName] = useState("")
  const [isSubmittingRole, setIsSubmittingRole] = useState(false)

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [userRes, rolesRes] = await Promise.all([
        usersApi.getUserById(userId),
        rolesApi.getRoles(),
      ])
      if (userRes.data) {
        setUser(userRes.data)
        const firstRole = Array.isArray(userRes.data.roles) && userRes.data.roles.length > 0 ? userRes.data.roles[0] : null
        const roleName = typeof firstRole === "string" ? firstRole : (firstRole?.name || firstRole?.code || "Manager")
        setSelectedRoleName(roleName)
      }
      setAvailableRoles(rolesRes)
    } catch (err: any) {
      setError(err.message || `User record #${userId} not found in database.`)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [userId])

  const handleSaveRoleAssignment = async () => {
    if (!user || !selectedRoleName) return
    setIsSubmittingRole(true)
    try {
      const updatedRoles = [selectedRoleName]
      await usersApi.updateUser(user.id, { roles: updatedRoles })
      setUser({ ...user, roles: updatedRoles })
      showNotification(`Assigned role updated to "${selectedRoleName}".`)
      setIsEditRoleOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to assign role.")
    } finally {
      setIsSubmittingRole(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading user profile...</span>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="User Profile Not Found"
          description={`No user record found matching ID "${userId}".`}
          actions={
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/core/users">
                <ArrowLeft className="h-4 w-4" /> Return to Users Directory
              </Link>
            </Button>
          }
        />
        <Card className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">User Record Unavailable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error || `The user account (ID: ${userId}) does not exist in the database.`}
            </p>
          </div>
          <Button asChild variant="default" size="sm" className="mt-2">
            <Link href="/core/users">Back to User Directory</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // Extract department name
  let deptName = "General"
  if (typeof user.department === "object" && user.department?.name) {
    deptName = user.department.name
  } else if (typeof user.department === "string") {
    deptName = user.department
  }

  // Extract assigned role names
  const roleNames: string[] = Array.isArray(user.roles)
    ? user.roles.map((r) => (typeof r === "string" ? r : r.name || r.code || "User"))
    : ["User"]

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={`User Account & Security Profile (ID: #${user.id})`}
        badge={
          <Badge
            variant={user.status === "Active" ? "success" : "destructive"}
            className="gap-1 font-mono"
          >
            {user.status || "Active"}
          </Badge>
        }
        actions={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/core/users">
              <ArrowLeft className="h-4 w-4" /> Back to Users Directory
            </Link>
          </Button>
        }
      />

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Profile Banner Card */}
      <Card className="border border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar fallback={user.name} size="xl" />
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {user.email}
                  </span>
                  {user.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="h-3.5 w-3.5 text-primary" /> {user.phone}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-primary" /> {deptName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={() => setIsEditRoleOpen(true)} className="gap-2">
                <Shield className="h-4 w-4" /> Assign Role
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigator */}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview & Roles", icon: <ShieldCheck className="h-4 w-4" /> },
          { id: "permissions", label: "Direct Permissions", icon: <Key className="h-4 w-4" />, badge: user.permissions?.length || 0 },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
              <div>
                <CardTitle className="text-sm font-bold">Assigned Security Roles</CardTitle>
                <CardDescription className="text-xs">Active roles governing user permissions</CardDescription>
              </div>
              <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => setIsEditRoleOpen(true)}>
                <Shield className="h-3.5 w-3.5 text-primary" /> Edit
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {roleNames.map((roleName, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs">{roleName}</span>
                  <Badge variant="default" className="text-[10px]">
                    Active Role
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold">Account Specifications</CardTitle>
              <CardDescription className="text-xs">Metadata & Department IDs</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono font-bold text-foreground">#{user.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Department ID</span>
                <span className="font-mono font-bold text-foreground">{user.department_id || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Account Status</span>
                <Badge variant={user.status === "Active" ? "success" : "destructive"} className="text-[10px]">
                  {user.status || "Active"}
                </Badge>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Created Date</span>
                <span className="font-mono text-foreground">{user.created_at ? user.created_at.split("T")[0] : "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "permissions" && (
        <Card className="border border-border/60">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold">Direct Permission Grants</CardTitle>
            <CardDescription className="text-xs">
              Permissions granted directly to this user outside of their primary security role.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {!user.permissions || user.permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 text-center">
                No direct permissions assigned. User inherits all permissions via primary role.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((perm, idx) => (
                  <Badge key={idx} variant="outline" className="font-mono text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Role Dialog Modal */}
      <Dialog
        open={isEditRoleOpen}
        onClose={() => setIsEditRoleOpen(false)}
        title="Assign User Security Role"
      >
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Select Primary Role *</label>
            <select
              value={selectedRoleName}
              onChange={(e) => setSelectedRoleName(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
            >
              {availableRoles.length === 0 ? (
                <option value="Manager">Manager</option>
              ) : (
                availableRoles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveRoleAssignment} disabled={isSubmittingRole}>
              {isSubmittingRole ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Role Assignment
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
