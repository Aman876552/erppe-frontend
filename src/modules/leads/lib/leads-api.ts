import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import { Lead, CreateLeadPayload, UpdateLeadPayload, LeadQueryParams } from "../types/lead"
import { ApiResponse } from "@/modules/core/types/api"

export class LeadsApiService {
  /**
   * GET /api/leads
   */
  async getLeads(params: LeadQueryParams = {}): Promise<ApiResponse<Lead[]>> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append("search", params.search)
    if (params.status) searchParams.append("status", params.status)
    if (params.leadPriority) searchParams.append("leadPriority", params.leadPriority)
    if (params.leadSource) searchParams.append("leadSource", params.leadSource)
    if (params.assignedTo) searchParams.append("assignedTo", params.assignedTo)

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.leads.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response
    let leadList: Lead[] = []

    if (Array.isArray(rawData)) {
      leadList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      leadList = rawData.data
    } else if (Array.isArray(response)) {
      leadList = response
    }

    return {
      success: true,
      data: leadList,
    }
  }

  /**
   * GET /api/leads/{id}
   */
  async getLeadById(id: string | number): Promise<ApiResponse<Lead>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.leads.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
    }
  }

  /**
   * POST /api/leads
   */
  async createLead(payload: CreateLeadPayload): Promise<ApiResponse<Lead>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.leads.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Lead created successfully.",
    }
  }

  /**
   * PUT /api/leads/{id}
   */
  async updateLead(id: string | number, payload: UpdateLeadPayload): Promise<ApiResponse<Lead>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.leads.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Lead updated successfully.",
    }
  }

  /**
   * DELETE /api/leads/{id}
   */
  async deleteLead(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.leads.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Lead ${id} deleted successfully.`,
    }
  }
}

export const leadsApi = new LeadsApiService()
