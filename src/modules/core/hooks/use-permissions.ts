import { useAuthStore } from "../stores/auth-store"
import { hasPermission, hasRole, hasAnyRole, canAccessModule } from "../lib/permissions"
import { RoleCode } from "../types/auth"

export function usePermissions() {
  const user = useAuthStore((state) => state.user)

  return {
    can: (permission: string) => hasPermission(user, permission),
    isRole: (roleCode: RoleCode) => hasRole(user, roleCode),
    hasAnyRole: (roleCodes: RoleCode[]) => hasAnyRole(user, roleCodes),
    canAccessModule: (moduleKey: string) => canAccessModule(user, moduleKey),
    isSuperAdmin: hasRole(user, "SUPER_ADMIN"),
  }
}
