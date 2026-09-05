"use client"

import React, { useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { Toolbar } from "@/modules/core/components/data-table/toolbar"
import { StatusBadge } from "@/modules/core/components/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { User, Role } from "@/modules/core/types/auth"
import { UserPlus, Eye, Edit, ShieldAlert, Mail, User as UserIcon } from "lucide-react"

const MOCK_USERS_DATA: User[] = [
  {
    id: "usr_101",
    name: "Alexander Wright",
    email: "alexander.wright@enterprise.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    department: "System Administration",
    designation: "Enterprise Security Lead",
    status: "active",
    roles: [
      { id: "r1", name: "Super Administrator", code: "SUPER_ADMIN", description: "Full access", permissions: [], createdAt: "", updatedAt: "" },
    ],
    permissions: ["*"],
    lastLoginAt: "2026-09-04T12:00:00Z",
    createdAt: "2026-01-15T08:30:00Z",
    updatedAt: "2026-09-04T12:00:00Z",
  },
  {
    id: "usr_102",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@enterprise.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    department: "Human Resources",
    designation: "HR Operations Manager",
    status: "active",
    roles: [
      { id: "r2", name: "HR Manager", code: "MANAGER", description: "HR access", permissions: [], createdAt: "", updatedAt: "" },
    ],
    permissions: ["hr.view", "hr.manage"],
    lastLoginAt: "2026-09-03T16:45:00Z",
    createdAt: "2026-02-10T10:00:00Z",
    updatedAt: "2026-09-03T16:45:00Z",
  },
  {
    id: "usr_103",
    name: "Michael Chang",
    email: "michael.chang@enterprise.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "Finance & Accounts",
    designation: "Senior Financial Auditor",
    status: "active",
    roles: [
      { id: "r3", name: "Auditor", code: "AUDITOR", description: "Audit access", permissions: [], createdAt: "", updatedAt: "" },
    ],
    permissions: ["audits.view", "expenses.view"],
    lastLoginAt: "2026-09-04T09:15:00Z",
    createdAt: "2026-03-01T11:20:00Z",
    updatedAt: "2026-09-04T09:15:00Z",
  },
  {
    id: "usr_104",
    name: "Elena Rostova",
    email: "elena.rostova@enterprise.com",
    avatar: "",
    department: "Procurement",
    designation: "Supply Chain Analyst",
    status: "suspended",
    roles: [
      { id: "r4", name: "Standard User", code: "USER", description: "Basic access", permissions: [], createdAt: "", updatedAt: "" },
    ],
    permissions: ["procurement.view"],
    lastLoginAt: "2026-08-20T14:30:00Z",
    createdAt: "2026-04-12T09:00:00Z",
    updatedAt: "2026-08-20T14:30:00Z",
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS_DATA)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newDepartment, setNewDepartment] = useState("System Administration")
  const [newRole, setNewRole] = useState("SUPER_ADMIN")

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter ? u.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newEmail) return

    const newUser: User = {
      id: "usr_" + Date.now(),
      name: newName,
      email: newEmail,
      department: newDepartment,
      status: "active",
      roles: [
        {
          id: "role_custom",
          name: newRole === "SUPER_ADMIN" ? "Super Administrator" : "Standard User",
          code: newRole as any,
          description: "Assigned role",
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      permissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setUsers([newUser, ...users])
    setNewName("")
    setNewEmail("")
    setIsAddUserOpen(false)
  }

  const columns: Column<User>[] = [
    {
      key: "user",
      title: "User Profile",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatar} fallback={row.name} size="sm" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{row.name}</span>
            <span className="text-xs text-muted-foreground">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      title: "Department & Position",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">{row.department || "General"}</span>
          <span className="text-[11px] text-muted-foreground">{row.designation || "Staff"}</span>
        </div>
      ),
    },
    {
      key: "role",
      title: "Assigned Role",
      render: (row) => (
        <Badge variant="outline" className="font-medium text-xs bg-primary/5 text-primary border-primary/20">
          {row.roles?.[0]?.name || "User"}
        </Badge>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Profile">
            <Link href={`/core/users/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="Edit Permissions">
            <Link href={`/core/users/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management Directory"
        description="Centralized directory of enterprise user accounts, department assignments, and access privileges."
        actions={
          <Button onClick={() => setIsAddUserOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" /> Add New User
          </Button>
        }
      />

      {/* Toolbar Search & Status Filter */}
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOption={statusFilter}
        onFilterChange={setStatusFilter}
        filterOptions={[
          { label: "Active Users", value: "active" },
          { label: "Suspended Users", value: "suspended" },
          { label: "Pending Activation", value: "pending" },
        ]}
      />

      {/* Enterprise Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.id}
        page={page}
        pageSize={pageSize}
        totalItems={filteredUsers.length}
        totalPages={Math.ceil(filteredUsers.length / pageSize)}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Create User Dialog Modal */}
      <Dialog
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Create New User Account"
        description="Provision a new enterprise user account and assign system access roles."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Full Name</label>
            <Input
              placeholder="e.g. Eleanor Vance"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              icon={<UserIcon className="h-4 w-4" />}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Work Email Address</label>
            <Input
              type="email"
              placeholder="eleanor@enterprise.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <Select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                options={[
                  { label: "System Administration", value: "System Administration" },
                  { label: "Human Resources", value: "Human Resources" },
                  { label: "Finance & Accounts", value: "Finance & Accounts" },
                  { label: "Procurement", value: "Procurement" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Assigned Role</label>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                options={[
                  { label: "Super Administrator", value: "SUPER_ADMIN" },
                  { label: "System Administrator", value: "ADMIN" },
                  { label: "Department Manager", value: "MANAGER" },
                  { label: "Standard User", value: "USER" },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Create User Account
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
