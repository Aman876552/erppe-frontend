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

// Helper to synchronously read persisted session on initial store load
const getInitialAuthState = () => {
  if (typeof window === "undefined") {
    return { user: null, tokens: null, isAuthenticated: false }
  }
  const user = authStorage.getUser()
  const token = authStorage.getAccessToken()
  if (user && token) {
    return {
      user,
      tokens: { accessToken: token, refreshToken: authStorage.getRefreshToken() || "", expiresIn: 86400 },
      isAuthenticated: true,
    }
  }
  return { user: null, tokens: null, isAuthenticated: false }
}

const initialAuth = getInitialAuthState()

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialAuth.user,
  tokens: initialAuth.tokens,
  isAuthenticated: initialAuth.isAuthenticated,
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
    console.log(`[AUTH STORE LOGIN INITIATED] Email: ${credentials.email}`)

    try {
      // Direct Real API Call to backend at http://127.0.0.1:8000/api/auth/login
      const response = await apiClient.post<any>(apiConfig.endpoints.auth.login, {
        email: credentials.email,
        password: credentials.password,
      })

      console.log(`[AUTH STORE LOGIN RESPONSE RAW]`, response)

      // Extract response fields flexible for standard Laravel/Express/FastAPI structures
      const resPayload = response.data || response
      const accessToken =
        resPayload.access_token ||
        resPayload.token ||
        resPayload.bearer_token ||
        resPayload.authorisation?.token ||
        resPayload.authorization?.token ||
        resPayload.tokens?.accessToken ||
        resPayload.data?.access_token ||
        resPayload.data?.token ||
        resPayload.data?.bearer_token

      console.log(`[AUTH STORE EXTRACTED TOKEN] Token:`, accessToken ? `${accessToken.substring(0, 15)}...` : "NOT FOUND")

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

      console.log(`[AUTH STORE SAVING TO STORAGE] User:`, userObj)
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
      console.error(`[AUTH STORE LOGIN ERROR]`, err)
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
