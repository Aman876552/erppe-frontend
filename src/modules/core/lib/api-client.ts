import { apiConfig } from "@/config/api"
import { authStorage } from "./auth"
import { ApiResponse, ApiError } from "../types/api"

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = apiConfig.baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = authStorage.getAccessToken()
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        authStorage.clearAuth()
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login"
        }
      }

      const data = await response.json()

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || "An unexpected API error occurred.",
          statusCode: response.status,
          errors: data.errors,
        }
        throw error
      }

      return data as ApiResponse<T>
    } catch (err: any) {
      if (err.statusCode) throw err
      
      throw {
        message: err.message || "Failed to connect to backend server.",
        statusCode: 500,
      } as ApiError
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  public post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
