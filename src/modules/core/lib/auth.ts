import { AuthTokens, User } from "../types/auth"

const TOKEN_KEY = "erp_auth_token"
const REFRESH_TOKEN_KEY = "erp_refresh_token"
const USER_KEY = "erp_user_data"

export const authStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  setTokens: (tokens: AuthTokens) => {
    if (typeof window === "undefined") return
    localStorage.setItem(TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },
  getUser: (): User | null => {
    if (typeof window === "undefined") return null
    const data = localStorage.getItem(USER_KEY)
    if (!data) return null
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
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
