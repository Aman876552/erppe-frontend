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

    if (options.body instanceof FormData) {
      delete headers["Content-Type"]
    }

    if (token && typeof token === "string" && token.trim().length > 0 && token !== "undefined" && token !== "null") {
      headers["Authorization"] = `Bearer ${token}`
    }

    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint}`

    console.log(`[API CLIENT REQUEST] ${options.method || "GET"} ${url}`, {
      hasToken: !!headers["Authorization"],
      tokenPreview: headers["Authorization"] ? `${headers["Authorization"].substring(0, 20)}...` : "NONE",
      headers,
    })

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`[API CLIENT RESPONSE] Status ${response.status} ${response.statusText} for ${url}`)

      if (response.status === 401) {
        console.warn(`[API CLIENT 401 UNAUTHORIZED] Token invalid or expired for ${url}. Clearing auth...`)
        authStorage.clearAuth()
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login"
        }
      }

      let data: any = {}
      try {
        data = await response.json()
        console.log(`[API CLIENT PAYLOAD]`, data)
      } catch (parseErr) {
        data = { message: response.statusText }
        console.warn(`[API CLIENT PAYLOAD PARSE ERROR]`, parseErr)
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data.message || (response.status === 403 ? "This action is unauthorized." : "An unexpected API error occurred."),
          statusCode: response.status,
          errors: data.errors,
        }
        console.error(`[API CLIENT ERROR] ${response.status} for ${url}:`, error, "Raw Response Data:", data)
        throw error
      }

      return data as ApiResponse<T>
    } catch (err: any) {
      if (err.statusCode) throw err

      console.error(`[API CLIENT NETWORK/CONNECT ERROR] for ${url}:`, err)
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
    const formattedBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formattedBody,
    })
  }

  public put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const formattedBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: formattedBody,
    })
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
