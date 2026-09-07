import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import { Fabricator, CreateFabricatorPayload, UpdateFabricatorPayload, FabricatorQueryParams } from "../types/fabricator"
import { ApiResponse } from "@/modules/core/types/api"

export class FabricatorsApiService {
  /**
   * GET /api/fabricators
   * Fetches full non-paginated array of fabricators.
   * Query params: search, fabricatorName, fabricationType, status
   */
  async getFabricators(params: FabricatorQueryParams = {}): Promise<ApiResponse<Fabricator[]>> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append("search", params.search)
    if (params.fabricatorName) searchParams.append("fabricatorName", params.fabricatorName)
    if (params.fabricationType) searchParams.append("fabricationType", params.fabricationType)
    if (params.status) searchParams.append("status", params.status)

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.fabricators.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)

    // Unpack plain array response returned by backend successResponse
    const rawData = response.data !== undefined ? response.data : response
    let fabricatorList: Fabricator[] = []

    if (Array.isArray(rawData)) {
      fabricatorList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      fabricatorList = rawData.data
    } else if (Array.isArray(response)) {
      fabricatorList = response
    }

    return {
      success: true,
      data: fabricatorList,
    }
  }

  /**
   * GET /api/fabricators/{id}
   * Fetches single fabricator detail
   */
  async getFabricatorById(id: string | number): Promise<ApiResponse<Fabricator>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.fabricators.detail(id))
    const fabObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: fabObj,
    }
  }

  /**
   * POST /api/fabricators
   * Required fields: fabricatorName, contactPerson, mobileNumber, fabricationType
   * Note: createdBy is auto-set on backend.
   */
  async createFabricator(payload: CreateFabricatorPayload): Promise<ApiResponse<Fabricator>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.fabricators.create, payload)
    const fabObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: fabObj,
      message: res.message || "Fabricator created successfully.",
    }
  }

  /**
   * PUT /api/fabricators/{id}
   * Partial update works fine.
   */
  async updateFabricator(id: string | number, payload: UpdateFabricatorPayload): Promise<ApiResponse<Fabricator>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.fabricators.update(id), payload)
    const fabObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: fabObj,
      message: res.message || "Fabricator updated successfully.",
    }
  }

  /**
   * DELETE /api/fabricators/{id}
   */
  async deleteFabricator(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.fabricators.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Fabricator ${id} deleted successfully.`,
    }
  }
}

export const fabricatorsApi = new FabricatorsApiService()
