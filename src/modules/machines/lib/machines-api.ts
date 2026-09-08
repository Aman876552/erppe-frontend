import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  Machine,
  DepartmentOption,
  VendorOption,
  CreateMachinePayload,
  UpdateMachinePayload,
  MachineQueryParams,
} from "../types/machine"
import { ApiResponse } from "@/modules/core/types/api"

export class MachinesApiService {
  /**
   * GET /api/machines
   * Supports search, filters, sorting, and pagination metadata envelopes.
   */
  async getMachines(
    params: MachineQueryParams = {}
  ): Promise<ApiResponse<Machine[]> & { meta?: any; links?: any }> {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.append("search", params.search)
    if (params.status) searchParams.append("status", params.status)

    const deptId = params.departmentId || params.department_id
    if (deptId !== undefined && deptId !== null && deptId !== "") {
      searchParams.append("departmentId", String(deptId))
    }

    const vendId = params.vendorId || params.vendor_id
    if (vendId !== undefined && vendId !== null && vendId !== "") {
      searchParams.append("vendorId", String(vendId))
    }

    const purchYr = params.purchaseYear || params.purchase_year
    if (purchYr !== undefined && purchYr !== null && purchYr !== "") {
      searchParams.append("purchaseYear", String(purchYr))
    }

    const brand = params.brandName || params.brand_name
    if (brand) searchParams.append("brandName", brand)

    if (params.sort_by) searchParams.append("sort_by", params.sort_by)
    if (params.sort_order) searchParams.append("sort_order", params.sort_order)

    if (params.per_page) searchParams.append("per_page", String(params.per_page))
    if (params.limit) searchParams.append("limit", String(params.limit))
    if (params.page) searchParams.append("page", String(params.page))
    if (params.paginate !== undefined) searchParams.append("paginate", String(params.paginate))

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.machines.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response

    let machineList: Machine[] = []
    let meta: any = response.meta || undefined
    let links: any = (response as any).links || undefined

    if (Array.isArray(rawData)) {
      machineList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      machineList = rawData.data
      if (rawData.meta) meta = rawData.meta
      if (rawData.links) links = rawData.links
    } else if (Array.isArray(response)) {
      machineList = response
    }

    return {
      success: response.success ?? true,
      data: machineList,
      message: response.message,
      meta,
      links,
    }
  }

  /**
   * GET /api/machines/{id}
   */
  async getMachineById(id: string | number): Promise<ApiResponse<Machine>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.machines.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message,
    }
  }

  /**
   * POST /api/machines
   */
  async createMachine(payload: CreateMachinePayload): Promise<ApiResponse<Machine>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.machines.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Machine registered successfully.",
    }
  }

  /**
   * PUT /api/machines/{id}
   */
  async updateMachine(id: string | number, payload: UpdateMachinePayload): Promise<ApiResponse<Machine>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.machines.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Machine profile updated successfully.",
    }
  }

  /**
   * DELETE /api/machines/{id}
   */
  async deleteMachine(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.machines.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Machine ${id} deleted successfully.`,
    }
  }

  /**
   * GET /api/departments
   * Supporting endpoint for department selection
   */
  async getDepartments(): Promise<DepartmentOption[]> {
    try {
      const res = await apiClient.get<any>(apiConfig.endpoints.departments.list)
      const raw = res.data !== undefined ? res.data : res
      if (Array.isArray(raw)) return raw
      if (raw && Array.isArray(raw.data)) return raw.data
      return []
    } catch (err) {
      console.warn("Could not fetch departments list:", err)
      return []
    }
  }

  /**
   * GET /api/vendors
   * Supporting endpoint for vendor selection
   */
  async getVendors(): Promise<VendorOption[]> {
    try {
      const res = await apiClient.get<any>(apiConfig.endpoints.vendors.list)
      const raw = res.data !== undefined ? res.data : res
      if (Array.isArray(raw)) return raw
      if (raw && Array.isArray(raw.data)) return raw.data
      return []
    } catch (err) {
      console.warn("Could not fetch vendors list:", err)
      return []
    }
  }

  /**
   * Helper to evaluate warranty status
   */
  getWarrantyStatus(warrantyExpiryDate?: string | null): {
    status: "EXPIRED" | "EXPIRING_SOON" | "ACTIVE" | "NONE"
    label: string
    daysLeft?: number
  } {
    if (!warrantyExpiryDate) return { status: "NONE", label: "No Warranty Date" }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expDate = new Date(warrantyExpiryDate)
    expDate.setHours(0, 0, 0, 0)

    const diffTime = expDate.getTime() - today.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) {
      return { status: "EXPIRED", label: "Warranty Expired", daysLeft }
    } else if (daysLeft <= 30) {
      return { status: "EXPIRING_SOON", label: `Expiring Soon (${daysLeft}d left)`, daysLeft }
    } else {
      return { status: "ACTIVE", label: `Active Warranty (${daysLeft}d left)`, daysLeft }
    }
  }
}

export const machinesApi = new MachinesApiService()
