"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { rolesApi, ApiRole, ApiPermission } from "@/modules/core/lib/roles-api"
import { Shield, ArrowLeft, Save, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

export default function RoleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = params.id as string

  const [role, setRole] = useState<ApiRole | null>(null)
  const [allPermissions, setAllPermissions] = useState<ApiPermission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRoleData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [rolesList, permsList] = await Promise.all([
          rolesApi.getRoles(),
          rolesApi.getPermissions(),
        ])

        setAllPermissions(permsList)
        const foundRole = rolesList.find((r) => String(r.id) === String(roleId))

        if (foundRole) {
          setRole(foundRole)
          const initialPerms = (foundRole.permissions || []).map((p) =>
            typeof p === "string" ? p : p.name || p.code || String(p)
          )
          setSelectedPermissions(initialPerms)
        } else {
          setRole({
            id: roleId,
            name: `Role #${roleId}`,
            guard_name: "sanctum",
            code: "CUSTOM",
            description: "Custom role permissions matrix.",
            permissions: [],
          })
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch role data.")
      } finally {
        setIsLoading(false)
      }
    }

    if (roleId) {
      loadRoleData()
    }
  }, [roleId])

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    )
  }

  const toggleModule = (codes: string[]) => {
    const allSelected = codes.every((c) => selectedPermissions.includes(c))
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((c) => !codes.includes(c)))
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...codes])))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      await rolesApi.updateRolePermissions(roleId, selectedPermissions, role?.name)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update role permissions.")
    } finally {
      setIsSaving(false)
    }
  }

  // Group permissions by module
  const groupedPermissions: Record<string, ApiPermission[]> = {}
  allPermissions.forEach((p) => {
    const mod = p.module || "General"
    if (!groupedPermissions[mod]) {
      groupedPermissions[mod] = []
    }
    groupedPermissions[mod].push(p)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permission Matrix Editor"
        description={`Editing Security Role: ${role ? role.name : roleId} (ID: ${roleId})`}
        badge={
          <Badge variant="default">
            Guard: {role?.guard_name || "sanctum"}
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/core/roles">
                <ArrowLeft className="h-4 w-4" /> Back to Roles
              </Link>
            </Button>
            <Button
              onClick={handleSave}
              variant="default"
              size="sm"
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Permission Changes
            </Button>
          </div>
        }
      />

      {isSaved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-500 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Role permission matrix updated successfully! Posted to{" "}
            <code className="font-mono">POST /api/role/updatepermissions/{roleId}</code>.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-500 animate-in fade-in">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading role matrix...</span>
          </div>
        </div>
      ) : (
        /* Permission Matrix Grid */
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
            const codes = perms.map((p) => p.name || p.code || String(p.id))
            const allSelected = codes.every((c) => selectedPermissions.includes(c))
            const grantedCount = selectedPermissions.filter((c) => codes.includes(c)).length

            return (
              <Card key={moduleName} className="border border-border/60">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 py-4">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> {moduleName}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {grantedCount} of {codes.length} keys granted
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleModule(codes)}
                    className="text-xs"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {perms.map((p) => {
                      const code = p.name || p.code || String(p.id)
                      const isChecked = selectedPermissions.includes(code)
                      return (
                        <div
                          key={code}
                          onClick={() => togglePermission(code)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? "border-primary/40 bg-primary/5 shadow-xs"
                              : "border-border bg-card/40 hover:bg-muted/40"
                          }`}
                        >
                          <div className="pointer-events-none mt-0.5">
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {}}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-foreground block">{p.description || p.name}</span>
                            <span className="text-[10px] font-mono text-primary font-semibold block">{code}</span>
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
      )}
    </div>
  )
}
