export type RoleCode = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "USER" | "AUDITOR"

export interface Permission {
  id: string
  code: string
  name: string
  module: string
  description?: string
}

export interface Role {
  id: string
  name: string
  code: RoleCode
  description: string
  isSystem?: boolean
  usersCount?: number
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  department?: string
  designation?: string
  status: "active" | "inactive" | "suspended" | "pending"
  roles: Role[]
  permissions: string[] // Direct permission codes
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
}
