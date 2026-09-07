import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  Client,
  ClientLocation,
  CreateClientPayload,
  UpdateClientPayload,
  ClientDocumentFiles,
  ClientQueryParams,
} from "../types/client"
import { ApiResponse } from "@/modules/core/types/api"

export class ClientsApiService {
  /**
   * GET /api/clients
   * Non-paginated plain array return
   * Query params: search, name, clientCode, email, status
   */
  async getClients(params: ClientQueryParams = {}): Promise<ApiResponse<Client[]>> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append("search", params.search)
    if (params.name) searchParams.append("name", params.name)
    if (params.clientCode) searchParams.append("clientCode", params.clientCode)
    if (params.email) searchParams.append("email", params.email)
    if (params.status) searchParams.append("status", params.status)

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.clients.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)

    // Unpack plain array response returned by backend
    const rawData = response.data !== undefined ? response.data : response
    let clientList: Client[] = []

    if (Array.isArray(rawData)) {
      clientList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      clientList = rawData.data
    } else if (Array.isArray(response)) {
      clientList = response
    }

    return {
      success: true,
      data: clientList,
    }
  }

  /**
   * GET /api/clients/{id}
   * Eager-loaded locations array included in response
   */
  async getClientById(id: string | number): Promise<ApiResponse<Client>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.clients.detail(id))
    const clientObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: clientObj,
    }
  }

  /**
   * Helper to build FormData with Spatie Media files & nested locations
   */
  private buildClientFormData(
    payload: CreateClientPayload | UpdateClientPayload,
    documentFiles?: ClientDocumentFiles,
    isUpdateMethodSpoofing: boolean = false
  ): FormData {
    const formData = new FormData()

    if (isUpdateMethodSpoofing) {
      formData.append("_method", "PUT")
    }

    // Append standard scalar fields
    const excludedKeys = [
      "locations",
      "panCard",
      "gstCertificate",
      "cinIncorporation",
      "msmeUdyam",
      "iecCertificate",
      "cancelledCheque",
      "agreementContract",
      "otherCompliance",
    ]

    Object.entries(payload).forEach(([key, value]) => {
      if (excludedKeys.includes(key) || value === undefined || value === null) return
      formData.append(key, String(value))
    })

    // Append File objects if new files were selected by user
    const docKeys = [
      "panCard",
      "gstCertificate",
      "cinIncorporation",
      "msmeUdyam",
      "iecCertificate",
      "cancelledCheque",
      "agreementContract",
      "otherCompliance",
    ] as const

    docKeys.forEach((docKey) => {
      if (documentFiles && documentFiles[docKey] instanceof File) {
        formData.append(docKey, documentFiles[docKey]!)
      } else if (payload[docKey] !== undefined && payload[docKey] !== null) {
        // Resend numeric media ID or string if untouched
        formData.append(docKey, String(payload[docKey]))
      }
    })

    // Append nested locations array format: locations[0][locationName]...
    if (Array.isArray(payload.locations)) {
      payload.locations.forEach((loc, idx) => {
        if (loc.id) formData.append(`locations[${idx}][id]`, String(loc.id))
        formData.append(`locations[${idx}][locationName]`, loc.locationName)
        if (loc.contactPerson) formData.append(`locations[${idx}][contactPerson]`, loc.contactPerson)
        if (loc.deliveryAddress) formData.append(`locations[${idx}][deliveryAddress]`, loc.deliveryAddress)
        if (loc.dispatchInstruction) formData.append(`locations[${idx}][dispatchInstruction]`, loc.dispatchInstruction)
        if (loc.transportTerms) formData.append(`locations[${idx}][transportTerms]`, loc.transportTerms)
        if (loc.taxShippingInfo) formData.append(`locations[${idx}][taxShippingInfo]`, loc.taxShippingInfo)
      })
    }

    return formData
  }

  /**
   * Check if any File object exists in documentFiles
   */
  private hasFileUploads(documentFiles?: ClientDocumentFiles): boolean {
    if (!documentFiles) return false
    return Object.values(documentFiles).some((file) => file instanceof File)
  }

  /**
   * POST /api/clients
   */
  async createClient(payload: CreateClientPayload, documentFiles?: ClientDocumentFiles): Promise<ApiResponse<Client>> {
    const hasFiles = this.hasFileUploads(documentFiles)
    let res: any

    if (hasFiles) {
      const formData = this.buildClientFormData(payload, documentFiles, false)
      res = await apiClient.post<any>(apiConfig.endpoints.clients.create, formData)
    } else {
      res = await apiClient.post<any>(apiConfig.endpoints.clients.create, payload)
    }

    const clientObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: clientObj,
      message: res.message || "Client created successfully.",
    }
  }

  /**
   * PUT /api/clients/{id}
   * If files are present, uses POST /api/clients/{id} with _method=PUT override
   */
  async updateClient(
    id: string | number,
    payload: UpdateClientPayload,
    documentFiles?: ClientDocumentFiles
  ): Promise<ApiResponse<Client>> {
    const hasFiles = this.hasFileUploads(documentFiles)
    let res: any

    if (hasFiles) {
      // Method spoofing workaround for Laravel multipart PUT
      const formData = this.buildClientFormData(payload, documentFiles, true)
      res = await apiClient.post<any>(apiConfig.endpoints.clients.detail(id), formData)
    } else {
      res = await apiClient.put<any>(apiConfig.endpoints.clients.update(id), payload)
    }

    const clientObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: clientObj,
      message: res.message || "Client updated successfully.",
    }
  }

  /**
   * DELETE /api/clients/{id}
   */
  async deleteClient(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.clients.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Client ${id} deleted successfully.`,
    }
  }

  /**
   * Standalone Client Location Operations (/api/client-locations)
   */
  async getClientLocations(clientId: string | number, search?: string): Promise<ApiResponse<ClientLocation[]>> {
    const searchParams = new URLSearchParams()
    searchParams.append("clientId", String(clientId))
    if (search) searchParams.append("search", search)

    const endpoint = `${apiConfig.endpoints.clientLocations.list}?${searchParams.toString()}`
    const res = await apiClient.get<any>(endpoint)
    const rawData = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: Array.isArray(rawData) ? rawData : rawData.data || [],
    }
  }

  async createClientLocation(payload: { clientId: string | number; locationName: string; contactPerson?: string; deliveryAddress?: string; dispatchInstruction?: string; transportTerms?: string; taxShippingInfo?: string }): Promise<ApiResponse<ClientLocation>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.clientLocations.create, payload)
    const locObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: locObj,
      message: res.message || "Location added successfully.",
    }
  }

  async deleteClientLocation(locationId: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.clientLocations.delete(locationId))
    return {
      success: true,
      data: { id: locationId },
      message: res?.message || `Location ${locationId} removed.`,
    }
  }
}

export const clientsApi = new ClientsApiService()
