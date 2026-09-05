"use client"

import React, { useState } from "react"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Key, Search, ShieldCheck } from "lucide-react"

const ALL_SYSTEM_PERMISSIONS = [
  { code: "*", name: "Master Admin Override", module: "System", desc: "Grants unrestricted super administrator access to all endpoints and operations." },
  { code: "users.view", name: "View Users Directory", module: "User & Core", desc: "Allows viewing user profiles and department info." },
  { code: "users.create", name: "Create User Accounts", module: "User & Core", desc: "Allows provisioning new employee accounts." },
  { code: "users.edit", name: "Edit User Profiles", module: "User & Core", desc: "Allows modifying user details and designations." },
  { code: "users.delete", name: "Delete / Suspend Users", module: "User & Core", desc: "Allows suspending or purging accounts." },
  { code: "roles.manage", name: "Manage Roles & RBAC", module: "User & Core", desc: "Allows modifying security roles and matrix." },
  { code: "audits.view", name: "View Security Audit Logs", module: "User & Core", desc: "Allows inspecting security activity trails." },
  { code: "clients.view", name: "View Client Accounts", module: "Client Management", desc: "Access client directory and contact details." },
  { code: "clients.manage", name: "Create & Edit Clients", module: "Client Management", desc: "Add new enterprise clients or edit profiles." },
  { code: "catalog.view", name: "View Catalog Items", module: "Product Catalog", desc: "Browse product SKUs and category listings." },
  { code: "catalog.manage", name: "Manage Products & Categories", module: "Product Catalog", desc: "Add or update products and unit conversions." },
  { code: "sales.orders.view", name: "View Sales Orders", module: "Sales Orders", desc: "Access sales order directory and status." },
  { code: "sales.orders.create", name: "Create & Approve Orders", module: "Sales Orders", desc: "Issue new customer sales orders." },
  { code: "procurement.vendors.view", name: "View Vendors", module: "Procurement", desc: "Access supplier directory and accounts." },
  { code: "procurement.po.create", name: "Issue Purchase Orders", module: "Procurement", desc: "Create and dispatch purchase orders to suppliers." },
  { code: "hr.employees.view", name: "View HR Employees", module: "Human Resources", desc: "Access employee records and payroll stubs." },
  { code: "expenses.vouchers.approve", name: "Approve Financial Vouchers", module: "Expenses", desc: "Sign off on operating expense claims." },
]

export default function PermissionsPage() {
  const [search, setSearch] = useState("")

  const filteredPermissions = ALL_SYSTEM_PERMISSIONS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Keys Dictionary"
        description="Master index of all security permission keys registered across ERP domain modules."
        badge={<Badge variant="info">64 System Keys</Badge>}
      />

      <div className="w-full sm:w-80">
        <Input
          placeholder="Search permission keys..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPermissions.map((p) => (
          <Card key={p.code} className="hover:border-primary/40 transition-colors">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 text-primary border-primary/20">
                  <Key className="h-3 w-3 mr-1" /> {p.code}
                </Badge>
                <span className="text-[10px] font-semibold text-muted-foreground">{p.module}</span>
              </div>
              <CardTitle className="text-sm font-bold text-foreground mt-2">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
