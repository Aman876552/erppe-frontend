export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  endpoints: {
    auth: {
      login: "/auth/login",
      logout: "/auth/logout",
      me: "/auth/me",
      refreshToken: "/auth/refresh",
      forgotPassword: "/auth/forgot-password",
      resetPassword: "/auth/reset-password",
    },
    users: {
      list: "/users",
      detail: (id: string) => `/users/${id}`,
      create: "/users",
      update: (id: string) => `/users/${id}`,
      delete: (id: string) => `/users/${id}`,
      roles: (id: string) => `/users/${id}/roles`,
    },
    roles: {
      list: "/roles",
      detail: (id: string) => `/roles/${id}`,
      create: "/roles",
      update: (id: string) => `/roles/${id}`,
      delete: (id: string) => `/roles/${id}`,
      permissions: (id: string) => `/roles/${id}/permissions`,
    },
    permissions: {
      list: "/permissions",
    },
  },
}
