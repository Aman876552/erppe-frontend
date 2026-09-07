import { apiClient } from "./api-client"
import { apiConfig } from "@/config/api"

export interface ApiPermission {
  id?: string | number
  name: string
  guard_name?: string
  code?: string
  module?: string
  description?: string
}

export interface ApiRole {
  id: string | number
  name: string
  guard_name?: string
  code?: string
  description?: string
  isSystem?: boolean
  usersCount?: number
  permissions: (string | ApiPermission)[]
  createdAt?: string
  updatedAt?: string
}

export type Role = ApiRole

export interface CreateRolePayload {
  name: string
  guard_name?: string
  description?: string
}

export interface CreatePermissionPayload {
  name: string
  guard_name?: string
  module?: string
  description?: string
}

export interface AssignPermissionPayload {
  role: string
  permissions: string[]
}

export interface UpdateRolePermissionsPayload {
  permissions: string[]
}

export class RolesApiService {
  /**
   * Fetch all roles from GET /api/roles directly from API
   */
  async getRoles(): Promise<ApiRole[]> {
    const res = await apiClient.get<any>(apiConfig.endpoints.roles.list)
    const data = Array.isArray(res) ? res : res.data || []
    return (data as any[]).map((role: any) => ({
      ...role,
      permissions: Array.isArray(role.permissions)
        ? role.permissions.map((p: any) => (typeof p === "string" ? p : p.name || p.code || p.id))
        : [],
    }))
  }

  /**
   * Store role: POST /api/roles
   * Payload: { "name": "Editor", "guard_name": "sanctum" }
   */
  async createRole(payload: CreateRolePayload): Promise<ApiRole> {
    const body = {
      name: payload.name,
      guard_name: payload.guard_name || "sanctum",
      ...(payload.description ? { description: payload.description } : {}),
    }

    const res = await apiClient.post<any>(apiConfig.endpoints.roles.create, body)
    const createdRole = res.data !== undefined ? res.data : res
    return {
      id: createdRole.id || `role_${Date.now()}`,
      name: createdRole.name || payload.name,
      guard_name: createdRole.guard_name || body.guard_name,
      description: createdRole.description || payload.description || "",
      permissions: createdRole.permissions || [],
    }
  }

  /**
   * Update role permissions: PUT /api/role/updatepermissions/{id}
   * Payload: { "permissions": ["users.view", "users.create"] }
   */
  async updateRolePermissions(roleId: string | number, permissions: string[], roleName?: string): Promise<any> {
    const endpoint = apiConfig.endpoints.roles.updatePermissions(roleId)
    const payload: UpdateRolePermissionsPayload = { permissions }

    try {
      return await apiClient.put<any>(endpoint, payload)
    } catch (err: any) {
      if (roleName) {
        return await apiClient.put<any>(apiConfig.endpoints.roles.detail(String(roleId)), {
          name: roleName,
          permissions,
        })
      }
      throw err
    }
  }

  /**
   * Assign permissions to role: POST /api/role/assignpermission
   * Payload format: { "role": "Manager", "permissions": ["users.create"] }
   */
  async assignPermission(roleName: string, permissions: string | string[]): Promise<any> {
    const permArray = Array.isArray(permissions) ? permissions : [permissions]
    const payload: AssignPermissionPayload = { role: roleName, permissions: permArray }
    return await apiClient.post<any>(apiConfig.endpoints.roles.assignPermission, payload)
  }

  /**
   * Fetch all permissions from GET /api/permissions directly from API
   */
  async getPermissions(): Promise<ApiPermission[]> {
    const res = await apiClient.get<any>(apiConfig.endpoints.permissions.list)
    const data = Array.isArray(res) ? res : res.data || []
    return (data as any[]).map((perm: any) => ({
      id: perm.id || perm.name,
      name: perm.name || perm.code || String(perm),
      code: perm.code || perm.name,
      guard_name: perm.guard_name || "sanctum",
      module: perm.module || "General",
      description: perm.description || perm.desc || "",
    }))
  }

  /**
   * Store permission: POST /api/permissions
   */
  async createPermission(payload: CreatePermissionPayload): Promise<ApiPermission> {
    const body = {
      name: payload.name,
      guard_name: payload.guard_name || "sanctum",
      ...(payload.module ? { module: payload.module } : {}),
      ...(payload.description ? { description: payload.description } : {}),
    }

    const res = await apiClient.post<any>(apiConfig.endpoints.permissions.create, body)
    const created = res.data !== undefined ? res.data : res
    return {
      id: created.id || `perm_${Date.now()}`,
      name: created.name || payload.name,
      code: created.name || payload.name,
      guard_name: created.guard_name || body.guard_name,
      module: created.module || payload.module || "General",
      description: created.description || payload.description || "",
    }
  }
}

export const rolesApi = new RolesApiService()
