import { create } from "zustand"
import { User, AuthTokens, LoginCredentials } from "../types/auth"
import { authStorage } from "../lib/auth"
import { apiClient } from "../lib/api-client"
import { apiConfig } from "@/config/api"

interface AuthStore {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => {
    if (user) {
      authStorage.setUser(user)
    } else {
      authStorage.clearAuth()
    }
    set({ user, isAuthenticated: !!user })
  },

  login: async (credentials) => {
    set({ isLoading: true })

    try {
      // Direct Real API Call to backend at http://127.0.0.1:8000/api/auth/login
      const response = await apiClient.post<any>(apiConfig.endpoints.auth.login, {
        email: credentials.email,
        password: credentials.password,
      })

      // Extract response fields flexible for standard Laravel/Express/FastAPI structures
      const resPayload = response.data || response
      const accessToken =
        resPayload.access_token ||
        resPayload.token ||
        resPayload.tokens?.accessToken ||
        resPayload.data?.access_token ||
        resPayload.data?.token

      if (!accessToken) {
        throw new Error(response.message || "Failed to extract access token from server response.")
      }

      const rawUser = resPayload.user || resPayload.data?.user || resPayload.data || {}
      
      const userObj: User = {
        id: rawUser.id ? String(rawUser.id) : "usr_" + Date.now(),
        name: rawUser.name || rawUser.full_name || credentials.email.split("@")[0],
        email: rawUser.email || credentials.email,
        avatar: rawUser.avatar || rawUser.profile_photo_url || "",
        department: rawUser.department || rawUser.dept || "General",
        designation: rawUser.designation || rawUser.title || "Staff",
        status: rawUser.status || "active",
        roles: Array.isArray(rawUser.roles) && rawUser.roles.length > 0
          ? rawUser.roles
          : [
              {
                id: "role_admin",
                name: "Administrator",
                code: "SUPER_ADMIN",
                description: "System User",
                permissions: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
        permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : ["*"],
        createdAt: rawUser.created_at || new Date().toISOString(),
        updatedAt: rawUser.updated_at || new Date().toISOString(),
      }

      const tokens: AuthTokens = {
        accessToken,
        refreshToken: resPayload.refresh_token || resPayload.data?.refresh_token || "",
        expiresIn: resPayload.expires_in || 86400,
      }

      authStorage.setUser(userObj)
      authStorage.setTokens(tokens)

      set({
        user: userObj,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      })

      return { success: true }
    } catch (err: any) {
      set({ isLoading: false })
      return {
        success: false,
        message: err.message || "Invalid credentials provided.",
      }
    }
  },

  logout: async () => {
    try {
      await apiClient.post(apiConfig.endpoints.auth.logout).catch(() => {})
    } finally {
      authStorage.clearAuth()
      set({ user: null, tokens: null, isAuthenticated: false, isLoading: false })
    }
  },

  initialize: () => {
    const savedUser = authStorage.getUser()
    const token = authStorage.getAccessToken()

    if (savedUser && token) {
      set({
        user: savedUser,
        tokens: { accessToken: token, refreshToken: authStorage.getRefreshToken() || "", expiresIn: 86400 },
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      // Unauthenticated initial state
      set({ user: null, tokens: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
