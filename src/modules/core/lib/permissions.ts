import { User, RoleCode } from "../types/auth"
import { ERP_MODULES } from "@/config/modules"

export function hasPermission(user: User | null, requiredPermission: string): boolean {
  if (!user) return false
  
  // Super admin override
  if (user.roles?.some(r => r.code === "SUPER_ADMIN")) {
    return true
  }

  // Check direct permissions
  if (user.permissions?.includes(requiredPermission) || user.permissions?.includes("*")) {
    return true
  }

  // Check role-based permissions
  const rolePermissions = user.roles?.flatMap(role => role.permissions?.map(p => p.code) || []) || []
  return rolePermissions.includes(requiredPermission) || rolePermissions.includes("*")
}

export function hasRole(user: User | null, roleCode: RoleCode): boolean {
  if (!user) return false
  return user.roles?.some(r => r.code === roleCode) || false
}

export function hasAnyRole(user: User | null, roleCodes: RoleCode[]): boolean {
  if (!user) return false
  return user.roles?.some(r => roleCodes.includes(r.code)) || false
}

export function isModuleActive(moduleKey: string): boolean {
  const module = ERP_MODULES[moduleKey]
  return module ? module.status === "active" : false
}

export function canAccessModule(user: User | null, moduleKey: string): boolean {
  if (!isModuleActive(moduleKey)) return false
  if (!user) return false
  if (hasRole(user, "SUPER_ADMIN")) return true
  
  return true // Active modules reachable by default unless restricted by fine-grained permissions
}
