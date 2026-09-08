import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
  ProductQueryParams,
} from "../types/product"
import { ApiResponse } from "@/modules/core/types/api"

export class ProductsApiService {
  /**
   * GET /api/products
   * Returns full array in data (client handles pagination and sorting).
   */
  async getProducts(params: ProductQueryParams = {}): Promise<ApiResponse<Product[]>> {
    const searchParams = new URLSearchParams()

    if (params.search) searchParams.append("search", params.search)
    if (params.sku) searchParams.append("sku", params.sku)
    if (params.productCode) searchParams.append("productCode", params.productCode)
    if (params.category) searchParams.append("category", params.category)
    if (params.itemLevel) searchParams.append("itemLevel", params.itemLevel)

    if (params.isOrderable !== undefined && params.isOrderable !== null && params.isOrderable !== "") {
      searchParams.append("isOrderable", String(params.isOrderable))
    }

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.products.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response

    let productList: Product[] = []
    if (Array.isArray(rawData)) {
      productList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      productList = rawData.data
    } else if (Array.isArray(response)) {
      productList = response
    }

    return {
      success: response.success ?? true,
      data: productList,
      message: response.message,
    }
  }

  /**
   * GET /api/products/{id}
   */
  async getProductById(id: string | number): Promise<ApiResponse<Product>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.products.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message,
    }
  }

  /**
   * POST /api/products
   */
  async createProduct(payload: CreateProductPayload): Promise<ApiResponse<Product>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.products.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Product created successfully.",
    }
  }

  /**
   * PUT /api/products/{id}
   */
  async updateProduct(id: string | number, payload: UpdateProductPayload): Promise<ApiResponse<Product>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.products.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Product updated successfully.",
    }
  }

  /**
   * DELETE /api/products/{id}
   */
  async deleteProduct(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.products.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Product ${id} deleted successfully.`,
    }
  }
}

export const productsApi = new ProductsApiService()
