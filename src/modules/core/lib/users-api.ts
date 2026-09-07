import { apiClient } from "./api-client"
import { apiConfig } from "@/config/api"
import { ApiResponse, QueryParams } from "../types/api"

export interface Department {
  id: number
  name: string
}

export interface User {
  id: string | number
  name: string
  email: string
  phone?: string | null
  status: "Active" | "Inactive" | string
  department_id?: number | null
  department?: Department | string | null
  roles?: string[] | any[]
  permissions?: string[]
  created_by?: string | null
  updated_by?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface CreateUserData {
  name: string
  email: string
  password?: string
  phone?: string
  department_id?: number
  status?: "Active" | "Inactive" | string
  roles?: string[]
  permissions?: string[]
}

export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  phone?: string
  department_id?: number
  status?: "Active" | "Inactive" | string
  roles?: string[]
  permissions?: string[]
}

export class UsersApiService {
  /**
   * GET /api/users
   */
  async getUsers(params: QueryParams = {}): Promise<ApiResponse<User[]>> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append("page", params.page.toString())
    if (params.pageSize) searchParams.append("pageSize", params.pageSize.toString())
    if (params.search) searchParams.append("search", params.search)
    if (params.filter?.status) searchParams.append("status", params.filter.status)
    if (params.filter?.department_id) searchParams.append("department_id", params.filter.department_id.toString())

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.users.list}${queryString ? `?${queryString}` : ""}`
    const response = await apiClient.get<any>(endpoint)

    // Handle various backend response wrappers ({ data: { user: [...] } } or { data: [...] } or [...])
    let userList: User[] = []
    const rawData = response.data !== undefined ? response.data : response

    if (Array.isArray(rawData)) {
      userList = rawData
    } else if (rawData && Array.isArray(rawData.users)) {
      userList = rawData.users
    } else if (rawData && Array.isArray(rawData.data)) {
      userList = rawData.data
    } else if (rawData && rawData.user) {
      userList = Array.isArray(rawData.user) ? rawData.user : [rawData.user]
    } else if (Array.isArray(response)) {
      userList = response
    }

    return {
      success: true,
      data: userList,
      meta: {
        page: params.page || 1,
        pageSize: params.pageSize || (userList.length > 0 ? userList.length : 10),
        totalItems: (response as any).total || (response as any).meta?.totalItems || userList.length,
        totalPages: (response as any).last_page || (response as any).meta?.totalPages || 1,
      },
    }
  }

  /**
   * GET /api/users/{id}
   */
  async getUserById(id: string | number): Promise<ApiResponse<User>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.users.detail(String(id)))
    const userObj = res.data?.user ? res.data.user : res.data ? res.data : res
    return {
      success: true,
      data: userObj,
    }
  }

  /**
   * POST /api/users
   */
  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    const payload: Record<string, any> = { ...data }
    // Ensure status defaults to Active if omitted
    if (!payload.status) payload.status = "Active"

    const res = await apiClient.post<any>(apiConfig.endpoints.users.create, payload)
    const userObj = res.data?.user ? res.data.user : res.data ? res.data : res
    return {
      success: true,
      data: userObj,
      message: res.message || "User created successfully.",
    }
  }

  /**
   * PUT /api/users/{id}
   */
  async updateUser(id: string | number, data: UpdateUserData): Promise<ApiResponse<User>> {
    const payload: Record<string, any> = { ...data }
    // Omit password entirely if omitted or empty on update
    if (!payload.password) {
      delete payload.password
    }

    const res = await apiClient.put<any>(apiConfig.endpoints.users.update(String(id)), payload)
    const userObj = res.data?.user ? res.data.user : res.data ? res.data : res
    return {
      success: true,
      data: userObj,
      message: res.message || "User updated successfully.",
    }
  }

  /**
   * DELETE /api/users/{id}
   */
  async deleteUser(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.users.delete(String(id)))
    return {
      success: true,
      data: { id },
      message: res?.message || `User ${id} deleted successfully.`,
    }
  }

  /**
   * GET /api/departments
   */
  async getDepartments(): Promise<ApiResponse<Department[]>> {
    try {
      const res = await apiClient.get<any>(apiConfig.endpoints.departments.list)
      const rawData = res.data !== undefined ? res.data : res
      let deptList: Department[] = []

      if (Array.isArray(rawData)) {
        deptList = rawData
      } else if (rawData && Array.isArray(rawData.departments)) {
        deptList = rawData.departments
      } else if (rawData && Array.isArray(rawData.data)) {
        deptList = rawData.data
      } else if (Array.isArray(res)) {
        deptList = res
      }

      return {
        success: true,
        data: deptList,
      }
    } catch (err) {
      console.warn("Failed to fetch departments lookup from API:", err)
      return {
        success: true,
        data: [],
      }
    }
  }
}

export const usersApi = new UsersApiService()
