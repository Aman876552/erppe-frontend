import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  InventoryItem,
  CreateInventoryItemPayload,
  UpdateInventoryItemPayload,
  InventoryQueryParams,
  PaginatedInventoryResponse,
} from "../types/inventory-item"
import { ApiResponse } from "@/modules/core/types/api"

export class InventoryApiService {
  /**
   * GET /api/inventory-items
   * Supports search, exact filters, sorting, and optional pagination.
   */
  async getInventoryItems(
    params: InventoryQueryParams = {}
  ): Promise<ApiResponse<InventoryItem[]> & { meta?: any; links?: any }> {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.append("search", params.search)
    if (params.code) searchParams.append("code", params.code)
    if (params.name) searchParams.append("name", params.name)
    if (params.type) searchParams.append("type", params.type)
    if (params.warehouse) searchParams.append("warehouse", params.warehouse)
    if (params.location) searchParams.append("location", params.location)
    if (params.materialType) searchParams.append("materialType", params.materialType)
    if (params.productId) searchParams.append("productId", params.productId)

    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== "") {
      searchParams.append("isActive", String(params.isActive))
    }

    if (params.needsSetup !== undefined && params.needsSetup !== null && params.needsSetup !== "") {
      searchParams.append("needsSetup", String(params.needsSetup))
    }

    if (params.sort_by) searchParams.append("sort_by", params.sort_by)
    if (params.sort_order) searchParams.append("sort_order", params.sort_order)

    if (params.per_page) searchParams.append("per_page", String(params.per_page))
    if (params.limit) searchParams.append("limit", String(params.limit))
    if (params.page) searchParams.append("page", String(params.page))
    if (params.paginate !== undefined) searchParams.append("paginate", String(params.paginate))

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.inventoryItems.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response

    let itemList: InventoryItem[] = []
    let meta: any = response.meta || undefined
    let links: any = (response as any).links || undefined

    if (Array.isArray(rawData)) {
      itemList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      itemList = rawData.data
      if (rawData.meta) meta = rawData.meta
      if (rawData.links) links = rawData.links
    } else if (Array.isArray(response)) {
      itemList = response
    }

    return {
      success: response.success ?? true,
      data: itemList,
      message: response.message,
      meta,
      links,
    }
  }

  /**
   * GET /api/inventory-items/{id}
   */
  async getInventoryItemById(id: string | number): Promise<ApiResponse<InventoryItem>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.inventoryItems.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message,
    }
  }

  /**
   * POST /api/inventory-items
   */
  async createInventoryItem(payload: CreateInventoryItemPayload): Promise<ApiResponse<InventoryItem>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.inventoryItems.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Inventory item created successfully.",
    }
  }

  /**
   * PUT /api/inventory-items/{id}
   */
  async updateInventoryItem(
    id: string | number,
    payload: UpdateInventoryItemPayload
  ): Promise<ApiResponse<InventoryItem>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.inventoryItems.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Inventory item updated successfully.",
    }
  }

  /**
   * DELETE /api/inventory-items/{id}
   */
  async deleteInventoryItem(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.inventoryItems.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Inventory item ${id} deleted successfully.`,
    }
  }

  /**
   * Generate code helper based on item type and name
   */
  generateCode(type: string = "RAW", name: string = ""): string {
    const prefixMap: Record<string, string> = {
      RAW: "RM",
      FINISHED: "FG",
      SEMI_FINISHED: "SF",
      CONSUMABLE: "CN",
      PACKAGING: "PK",
      SPARE: "SP",
    }

    const prefix = prefixMap[type.toUpperCase()] || "INV"
    const cleanName = name
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 4)
    const randomSuffix = Math.floor(100 + Math.random() * 900)

    return `${prefix}-${cleanName || "ITEM"}-${randomSuffix}`
  }
}

export const inventoryApi = new InventoryApiService()
