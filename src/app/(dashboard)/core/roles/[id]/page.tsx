"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, Save, CheckCircle2 } from "lucide-react"

const MODULE_PERMISSIONS = [
  {
    module: "User & Security Core",
    key: "core",
    permissions: [
      { code: "users.view", name: "View Users Directory", desc: "Allows viewing user profiles and department info." },
      { code: "users.create", name: "Create User Accounts", desc: "Allows provisioning new employee accounts." },
      { code: "users.edit", name: "Edit User Profiles", desc: "Allows modifying user details and designations." },
      { code: "users.delete", name: "Delete / Suspend Users", desc: "Allows suspending or purging accounts." },
      { code: "roles.manage", name: "Manage Roles & RBAC", desc: "Allows modifying security roles and matrix." },
      { code: "audits.view", name: "View Security Audit Logs", desc: "Allows inspecting security activity trails." },
    ],
  },
  {
    module: "Client Management (CRM)",
    key: "clients",
    permissions: [
      { code: "clients.view", name: "View Client Accounts", desc: "Access client directory and contact details." },
      { code: "clients.manage", name: "Create & Edit Clients", desc: "Add new enterprise clients or edit profiles." },
    ],
  },
  {
    module: "Product Catalog",
    key: "catalog",
    permissions: [
      { code: "catalog.view", name: "View Catalog Items", desc: "Browse product SKUs and category listings." },
      { code: "catalog.manage", name: "Manage Products & Categories", desc: "Add or update products and unit conversions." },
    ],
  },
  {
    module: "Sales Orders",
    key: "sales",
    permissions: [
      { code: "sales.orders.view", name: "View Sales Orders", desc: "Access sales order directory and status." },
      { code: "sales.orders.create", name: "Create & Approve Orders", desc: "Issue new customer sales orders." },
    ],
  },
]

export default function RoleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.id as string

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "users.view",
    "users.create",
    "users.edit",
    "roles.manage",
  ])
  const [isSaved, setIsSaved] = useState(false)

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    )
  }

  const toggleModule = (moduleKey: string, codes: string[]) => {
    const allSelected = codes.every((c) => selectedPermissions.includes(c))
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !codes.includes(c)))
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...codes])))
    }
  }

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Matrix Editor"
        description={`Editing Security Role: System Administrator (ID: ${roleId})`}
        badge={<Badge variant="default">RBAC Level 2</Badge>}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/core/roles">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Link>
            </Button>
            <Button onClick={handleSave} variant="default" size="sm" className="gap-2">
              <Save className="h-4 w-4" /> Save Permission Changes
            </Button>
          </div>
        }
      />

      {isSaved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-500 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>Role permission matrix updated successfully! All active sessions will refresh privileges.</span>
        </div>
      )}

      {/* Permission Matrix Grid */}
      <div className="space-y-6">
        {MODULE_PERMISSIONS.map((mod) => {
          const codes = mod.permissions.map((p) => p.code)
          const allSelected = codes.every((c) => selectedPermissions.includes(c))

          return (
            <Card key={mod.key}>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 py-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> {mod.module}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedPermissions.filter((c) => codes.includes(c)).length} of {codes.length} keys granted
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleModule(mod.key, codes)}
                  className="text-xs"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mod.permissions.map((p) => {
                    const isChecked = selectedPermissions.includes(p.code)
                    return (
                      <div
                        key={p.code}
                        onClick={() => togglePermission(p.code)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "border-primary/40 bg-primary/5 shadow-xs"
                            : "border-border bg-card/40 hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => togglePermission(p.code)}
                          className="mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-foreground block">{p.name}</span>
                          <span className="text-[10px] font-mono text-primary font-semibold block">{p.code}</span>
                          <p className="text-[11px] text-muted-foreground leading-snug">{p.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
