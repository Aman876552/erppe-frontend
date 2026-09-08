import { apiClient } from "@/modules/core/lib/api-client"
import { apiConfig } from "@/config/api"
import {
  Order,
  CreateOrderPayload,
  UpdateOrderPayload,
  OrderQueryParams,
} from "../types/order"
import { ApiResponse } from "@/modules/core/types/api"

export class OrdersApiService {
  /**
   * GET /api/orders
   * Query params: search, orderNo, clientId, status, orderManagerId
   * Non-paginated plain array return
   */
  async getOrders(params: OrderQueryParams = {}): Promise<ApiResponse<Order[]>> {
    const searchParams = new URLSearchParams()
    if (params.search) searchParams.append("search", params.search)
    if (params.orderNo) searchParams.append("orderNo", params.orderNo)
    if (params.clientId) searchParams.append("clientId", params.clientId)
    if (params.status) searchParams.append("status", params.status)
    if (params.orderManagerId) searchParams.append("orderManagerId", params.orderManagerId)

    const queryString = searchParams.toString()
    const endpoint = `${apiConfig.endpoints.orders.list}${queryString ? `?${queryString}` : ""}`

    const response = await apiClient.get<any>(endpoint)
    const rawData = response.data !== undefined ? response.data : response
    let orderList: Order[] = []

    if (Array.isArray(rawData)) {
      orderList = rawData
    } else if (rawData && Array.isArray(rawData.data)) {
      orderList = rawData.data
    } else if (Array.isArray(response)) {
      orderList = response
    }

    return {
      success: true,
      data: orderList,
    }
  }

  /**
   * GET /api/orders/{id}
   */
  async getOrderById(id: string | number): Promise<ApiResponse<Order>> {
    const res = await apiClient.get<any>(apiConfig.endpoints.orders.detail(id))
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
    }
  }

  /**
   * POST /api/orders
   */
  async createOrder(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    const res = await apiClient.post<any>(apiConfig.endpoints.orders.create, payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Order created successfully.",
    }
  }

  /**
   * PUT /api/orders/{id}
   */
  async updateOrder(id: string | number, payload: UpdateOrderPayload): Promise<ApiResponse<Order>> {
    const res = await apiClient.put<any>(apiConfig.endpoints.orders.update(id), payload)
    const obj = res.data !== undefined ? res.data : res
    return {
      success: true,
      data: obj,
      message: res.message || "Order updated successfully.",
    }
  }

  /**
   * DELETE /api/orders/{id}
   */
  async deleteOrder(id: string | number): Promise<ApiResponse<{ id: string | number }>> {
    const res = await apiClient.delete<any>(apiConfig.endpoints.orders.delete(id))
    return {
      success: true,
      data: { id },
      message: res?.message || `Order ${id} deleted successfully.`,
    }
  }
}

export const ordersApi = new OrdersApiService()
