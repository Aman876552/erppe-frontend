import React from "react"
import { usePermissions } from "../hooks/use-permissions"
import { RoleCode } from "../types/auth"

interface PermissionGuardProps {
  permission?: string
  role?: RoleCode
  roles?: RoleCode[]
  moduleKey?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  role,
  roles,
  moduleKey,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { can, isRole, hasAnyRole, canAccessModule } = usePermissions()

  if (moduleKey && !canAccessModule(moduleKey)) {
    return <>{fallback}</>
  }

  if (permission && !can(permission)) {
    return <>{fallback}</>
  }

  if (role && !isRole(role)) {
    return <>{fallback}</>
  }

  if (roles && !hasAnyRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
