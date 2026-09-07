"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { usersApi, User, Department, CreateUserData, UpdateUserData } from "@/modules/core/lib/users-api"
import { rolesApi, Role } from "@/modules/core/lib/roles-api"
import {
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Building2,
  ShieldCheck,
  Lock,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all") // "all" | "Active" | "Inactive"

  // Add User State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)
  const [addForm, setAddForm] = useState<CreateUserData>({
    name: "",
    email: "",
    phone: "",
    department_id: undefined,
    status: "Active",
    password: "",
    roles: [],
  })

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [changePasswordToggle, setChangePasswordToggle] = useState(false)
  const [editForm, setEditForm] = useState<UpdateUserData>({
    name: "",
    email: "",
    phone: "",
    department_id: undefined,
    status: "Active",
    password: "",
    roles: [],
  })

  // Delete User State
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Load Lookups (Departments & Roles)
  const loadLookups = async () => {
    try {
      const [deptRes, rolesRes] = await Promise.all([
        usersApi.getDepartments(),
        rolesApi.getRoles(),
      ])
      setDepartments(deptRes.data)
      setRoles(rolesRes)

      if (deptRes.data.length > 0 && !addForm.department_id) {
        setAddForm((prev) => ({ ...prev, department_id: deptRes.data[0].id }))
      }
      if (rolesRes.length > 0 && (!addForm.roles || addForm.roles.length === 0)) {
        setAddForm((prev) => ({ ...prev, roles: [rolesRes[0].name] }))
      }
    } catch (err) {
      console.warn("Failed to load departments or roles lookups:", err)
    }
  }

  // Load Users List
  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: any = {}
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (statusFilter !== "all") params.filter = { status: statusFilter }

      const res = await usersApi.getUsers(params)
      setUsers(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load user accounts.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLookups()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, statusFilter])

  // Open Create Modal
  const handleOpenAdd = () => {
    setAddForm({
      name: "",
      email: "",
      phone: "",
      department_id: departments[0]?.id,
      status: "Active",
      password: "",
      roles: roles[0]?.name ? [roles[0].name] : [],
    })
    setIsAddOpen(true)
  }

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.name || !addForm.email || !addForm.password) return

    setIsSubmittingAdd(true)
    setError(null)

    try {
      const res = await usersApi.createUser(addForm)
      showNotification(`User account "${addForm.name}" created successfully.`)
      setIsAddOpen(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to create user account.")
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    setChangePasswordToggle(false)

    // Extract first role name
    let userRoleName = roles[0]?.name || "USER"
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      const firstRole = user.roles[0]
      userRoleName = typeof firstRole === "string" ? firstRole : (firstRole?.name || firstRole?.code || userRoleName)
    }

    // Resolve department_id
    let deptId: number | undefined = user.department_id || undefined
    if (!deptId && typeof user.department === "object" && user.department?.id) {
      deptId = user.department.id
    }

    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      department_id: deptId || (departments[0]?.id),
      status: user.status === "Inactive" ? "Inactive" : "Active",
      password: "",
      roles: [userRoleName],
    })
  }

  // Submit Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSubmittingEdit(true)
    setError(null)

    const payload: UpdateUserData = { ...editForm }
    if (!changePasswordToggle || !payload.password?.trim()) {
      delete payload.password
    }

    try {
      await usersApi.updateUser(editingUser.id, payload)
      showNotification(`User account "${editForm.name}" updated successfully.`)
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to update user profile.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Submit Delete User
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    setIsSubmittingDelete(true)
    setError(null)

    try {
      await usersApi.deleteUser(deletingUser.id)
      showNotification(`User account "${deletingUser.name}" deleted successfully.`)
      setDeletingUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || "Failed to delete user account.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Table Columns
  const columns: Column<User>[] = [
    {
      key: "user",
      title: "User Profile",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={row.name} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-xs">{row.name}</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
              <Mail className="h-3 w-3 text-muted-foreground" /> {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      title: "Phone Number",
      render: (row) =>
        row.phone ? (
          <span className="text-xs font-mono text-foreground flex items-center gap-1">
            <Phone className="h-3 w-3 text-primary" /> {row.phone}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">—</span>
        ),
    },
    {
      key: "department",
      title: "Department",
      render: (row) => {
        let deptName = "—"
        if (typeof row.department === "object" && row.department?.name) {
          deptName = row.department.name
        } else if (typeof row.department === "string") {
          deptName = row.department
        } else if (row.department_id) {
          const found = departments.find((d) => d.id === row.department_id)
          if (found) deptName = found.name
        }
        return (
          <span className="text-xs font-medium text-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3 text-muted-foreground" /> {deptName}
          </span>
        )
      },
    },
    {
      key: "role",
      title: "Assigned Role",
      render: (row) => {
        const firstRole = Array.isArray(row.roles) && row.roles.length > 0 ? row.roles[0] : null
        const roleName = typeof firstRole === "string" ? firstRole : (firstRole?.name || firstRole?.code || "User")
        return (
          <Badge variant="outline" className="font-semibold text-[10px] bg-primary/5 text-primary border-primary/20 gap-1">
            <ShieldCheck className="h-3 w-3" /> {roleName}
          </Badge>
        )
      },
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const isActive = row.status?.toLowerCase() === "active"
        return (
          <Badge variant={isActive ? "success" : "destructive"} className="text-[10px] font-semibold">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Profile">
            <Link href={`/core/users/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit User"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete User"
            onClick={() => setDeletingUser(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Accounts Directory"
        description="Manage user access, role assignments, department associations, and active statuses."
        badge={<Badge variant="info">{users.length} Users Registered</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchUsers} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Add New User
            </Button>
          </div>
        }
      />

      {/* Notification Toast Banner */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 border border-border/50">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Active")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === "Active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Active Only
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Inactive")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                statusFilter === "Inactive" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Inactive Only
            </button>
          </div>
        </div>
      </Card>

      {/* Main Users DataTable */}
      <Card className="border border-border/60">
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
        />
      </Card>

      {/* Modal 1: Create New User */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Provision New User Account" maxWidth="lg">
        <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Full Name *</label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Rahul Verma"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address *</label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="e.g. rahul@company.com"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                value={addForm.phone || ""}
                onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Password (Min 8 Chars) *</label>
              <Input
                type="password"
                minLength={8}
                value={addForm.password || ""}
                onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="SecurePass123"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <select
                value={addForm.department_id || ""}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, department_id: parseInt(e.target.value) || undefined }))
                }
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              >
                {departments.length === 0 ? (
                  <option value="">No Departments Available</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Role Assignment</label>
              <select
                value={addForm.roles?.[0] || ""}
                onChange={(e) => setAddForm((prev) => ({ ...prev, roles: [e.target.value] }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              >
                {roles.length === 0 ? (
                  <option value="Manager">Manager</option>
                ) : (
                  roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status *</label>
              <select
                value={addForm.status || "Active"}
                onChange={(e) => setAddForm((prev) => ({ ...prev, status: e.target.value as "Active" | "Inactive" }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Create User Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit User Profile */}
      <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)} title="Edit User Profile" maxWidth="lg">
        <form onSubmit={handleUpdateUser} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <select
                value={editForm.department_id || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, department_id: parseInt(e.target.value) || undefined }))
                }
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Role Assignment</label>
              <select
                value={editForm.roles?.[0] || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, roles: [e.target.value] }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status *</label>
              <select
                value={editForm.status || "Active"}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as "Active" | "Inactive" }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="toggleChangePass"
                checked={changePasswordToggle}
                onChange={(e) => setChangePasswordToggle(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
              />
              <label htmlFor="toggleChangePass" className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> Change Password
              </label>
            </div>

            {changePasswordToggle && (
              <div className="pt-2 animate-in fade-in space-y-1">
                <label className="text-xs font-medium text-muted-foreground">New Password (Min 8 Chars)</label>
                <Input
                  type="password"
                  minLength={8}
                  value={editForm.password || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter new password..."
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save User Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Confirmation */}
      <Dialog open={Boolean(deletingUser)} onClose={() => setDeletingUser(null)} title="Delete User Account">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete user account{" "}
            <strong className="text-foreground font-semibold">"{deletingUser?.name}"</strong>? This will remove user privileges and system access.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Account
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
