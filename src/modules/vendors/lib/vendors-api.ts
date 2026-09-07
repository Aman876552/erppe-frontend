import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import { Vendor, CreateVendorPayload, UpdateVendorPayload, VendorQueryParams } from "../types/vendor"
import { ApiResponse } from "@/modules/core/types/api"

export class VendorsApiService {
  /**
   * GET /api/vendors
   * Fetches real vendor records from backend API
   */
  async getVendors(params: VendorQueryParams = {}): Promise<ApiResponse<Vendor[]>> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.append("page", params.page.toString())
    if (params.pageSize || params.per_page || params.limit) {
      const pSize = (params.pageSize || params.per_page || params.limit)!.toString()
      searchParams.append("per_page", pSize)
      searchParams.append("limit", pSize)
    }
    if (params.search) searchParams.append("search", params.search)
    if (params.city) searchParams.append("city", params.city)
    if (params.state) searchParams.append("state", params.state)
    if (params.name) searchParams.append("name", params.name)
    if (params.vendorCode) searchParams.append("vendorCode", params.vendorCode)
    if (params.email) searchParams.append("email", params.email)

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.vendors.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)

    // Unpack response data from backend API
    const rawData = response.data !== undefined ? response.data : response
    let vendorList: Vendor[] = []

    if (Array.isArray(rawData)) {
      vendorList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      vendorList = rawData.data
    } else if (Array.isArray(response)) {
      vendorList = response
    }

    return {
      success: true,
      data: vendorList,
      meta: response.meta || (rawData && rawData.meta) || {
        page: params.page || 1,
        pageSize: params.pageSize || vendorList.length,
        totalItems: (response as any).total || (rawData && rawData.total) || vendorList.length,
        totalPages: (rawData && rawData.last_page) || 1,
      },
    }
  }

  /**
   * GET /api/vendors/{id}
   * Fetches a single vendor profile by ID from backend API
   */
  async getVendorById(id: string | number): Promise<ApiResponse<Vendor>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.vendors.detail(id))
    const vendorObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: vendorObj,
    }
  }

  /**
   * POST /api/vendors
   * Creates a new vendor record. Note: createdBy is handled by backend.
   */
  async createVendor(payload: CreateVendorPayload): Promise<ApiResponse<Vendor>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.vendors.create, payload)
    const vendorObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: vendorObj,
      message: res.message || "Vendor created successfully.",
    }
  }

  /**
   * PUT /api/vendors/{id}
   * Updates existing vendor profile
   */
  async updateVendor(id: string | number, payload: UpdateVendorPayload): Promise<ApiResponse<Vendor>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.vendors.update(id), payload)
    const vendorObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: vendorObj,
      message: res.message || "Vendor updated successfully.",
    }
  }

  /**
   * DELETE /api/vendors/{id}
   * Deletes a vendor record from backend
   */
  async deleteVendor(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.vendors.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Vendor ${id} deleted successfully.`,
    }
  }
}

export const vendorsApi = new VendorsApiService()
