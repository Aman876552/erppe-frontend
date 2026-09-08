import { AuthTokens, User } from "../types/auth"

const TOKEN_KEY = "erp_auth_token"
const REFRESH_TOKEN_KEY = "erp_refresh_token"
const USER_KEY = "erp_user_data"

export const authStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null
    const token =
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("bearer_token")

    if (!token || token === "undefined" || token === "null" || token.trim() === "") {
      return null
    }
    return token
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null
    const ref = localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem("refresh_token")
    if (!ref || ref === "undefined" || ref === "null" || ref.trim() === "") {
      return null
    }
    return ref
  },
  setTokens: (tokens: AuthTokens) => {
    if (typeof window === "undefined") return
    if (!tokens.accessToken || tokens.accessToken === "undefined" || tokens.accessToken === "null") return

    localStorage.setItem(TOKEN_KEY, tokens.accessToken)
    localStorage.setItem("token", tokens.accessToken)
    localStorage.setItem("access_token", tokens.accessToken)
    localStorage.setItem("auth_token", tokens.accessToken)
    if (tokens.refreshToken && tokens.refreshToken !== "undefined" && tokens.refreshToken !== "null") {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    }
    if (typeof document !== "undefined") {
      document.cookie = `auth_token=${tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`
    }
  },
  getUser: (): User | null => {
    if (typeof window === "undefined") return null
    const data = localStorage.getItem(USER_KEY)
    if (!data || data === "undefined" || data === "null") return null
    try {
      return JSON.parse(data) as User
    } catch {
      return null
    }
  },
  setUser: (user: User) => {
    if (typeof window === "undefined") return
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearAuth: () => {
    if (typeof window === "undefined") return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem("token")
    localStorage.removeItem("access_token")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("bearer_token")
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem("refresh_token")
    localStorage.removeItem(USER_KEY)
    if (typeof document !== "undefined") {
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax`
    }
  },
}
