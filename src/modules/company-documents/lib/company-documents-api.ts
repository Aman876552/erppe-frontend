import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  CompanyDocument,
  CreateCompanyDocumentPayload,
  BulkCreateCompanyDocumentsPayload,
  UpdateCompanyDocumentPayload,
  CompanyDocumentQueryParams,
} from "../types/company-document"
import { ApiResponse } from "@/modules/core/types/api"

export class CompanyDocumentsApiService {
  /**
   * GET /api/company-documents
   * Supports search, documentName, isPrivate, expiringSoon filters
   */
  async getCompanyDocuments(params: CompanyDocumentQueryParams = {}): Promise<ApiResponse<CompanyDocument[]>> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append("search", params.search)
    if (params.documentName) searchParams.append("documentName", params.documentName)
    if (params.isPrivate !== undefined && params.isPrivate !== "") {
      searchParams.append("isPrivate", params.isPrivate ? "1" : "0")
    }
    if (params.expiringSoon !== undefined && params.expiringSoon !== "") {
      searchParams.append("expiringSoon", params.expiringSoon ? "1" : "0")
    }

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.companyDocuments.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response
    let docList: CompanyDocument[] = []

    if (Array.isArray(rawData)) {
      docList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      docList = rawData.data
    } else if (Array.isArray(response)) {
      docList = response
    }

    return {
      success: true,
      data: docList,
    }
  }

  /**
   * GET /api/company-documents/{id}
   */
  async getCompanyDocumentById(id: string | number): Promise<ApiResponse<CompanyDocument>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.companyDocuments.detail(id))
    const docObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: docObj,
    }
  }

  /**
   * Helper to build FormData for single document submission with file attachment
   */
  private buildDocumentFormData(
    payload: CreateCompanyDocumentPayload | UpdateCompanyDocumentPayload,
    isMethodSpoofing: boolean = false
  ): FormData {
    const formData = new FormData()

    if (isMethodSpoofing) {
      formData.append("_method", "PUT")
    }

    if (payload.documentName) formData.append("documentName", payload.documentName)
    if (payload.isPrivate !== undefined) {
      formData.append("isPrivate", payload.isPrivate ? "1" : "0")
    }
    if (payload.issueDate) formData.append("issueDate", payload.issueDate)
    if (payload.expiryDate) formData.append("expiryDate", payload.expiryDate)
    if (payload.reminderBeforeExpiry !== undefined && payload.reminderBeforeExpiry !== null) {
      formData.append("reminderBeforeExpiry", String(payload.reminderBeforeExpiry))
    }
    if (payload.notes) formData.append("notes", payload.notes)
    if (payload.rawData) formData.append("rawData", payload.rawData)

    if (payload.attachment instanceof File) {
      formData.append("attachment", payload.attachment)
    }

    return formData
  }

  /**
   * POST /api/company-documents (Single Document)
   */
  async createCompanyDocument(payload: CreateCompanyDocumentPayload): Promise<ApiResponse<CompanyDocument>> {
    let res: any

    if (payload.attachment instanceof File) {
      const formData = this.buildDocumentFormData(payload, false)
      res = await apiClient.post<any>(apiConfig.endpoints.companyDocuments.create, formData)
    } else {
      const jsonBody: Record<string, any> = { ...payload }
      delete jsonBody.attachment
      res = await apiClient.post<any>(apiConfig.endpoints.companyDocuments.create, jsonBody)
    }

    const docObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: docObj,
      message: res.message || "Company document created successfully.",
    }
  }

  /**
   * POST /api/company-documents (Bulk Create)
   */
  async bulkCreateCompanyDocuments(payload: BulkCreateCompanyDocumentsPayload): Promise<ApiResponse<CompanyDocument[]>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.companyDocuments.create, payload)
    const rawData = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: Array.isArray(rawData) ? rawData : rawData.data || [],
      message: res.message || "Company documents created in bulk successfully.",
    }
  }

  /**
   * PUT /api/company-documents/{id}
   * Uses POST with _method=PUT override when attachment File is present
   */
  async updateCompanyDocument(
    id: string | number,
    payload: UpdateCompanyDocumentPayload
  ): Promise<ApiResponse<CompanyDocument>> {
    let res: any

    if (payload.attachment instanceof File) {
      const formData = this.buildDocumentFormData(payload, true)
      res = await apiClient.post<any>(apiConfig.endpoints.companyDocuments.detail(id), formData)
    } else {
      const jsonBody: Record<string, any> = { ...payload }
      delete jsonBody.attachment
      res = await apiClient.put<any>(apiConfig.endpoints.companyDocuments.update(id), jsonBody)
    }

    const docObj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: docObj,
      message: res.message || "Company document updated successfully.",
    }
  }

  /**
   * DELETE /api/company-documents/{id}
   */
  async deleteCompanyDocument(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.companyDocuments.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Company document ${id} deleted successfully.`,
    }
  }
}

export const companyDocumentsApi = new CompanyDocumentsApiService()
