export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: PaginationMeta
  errors?: Record<string, string[]>
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface QueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  filter?: Record<string, any>
}

export interface ApiError {
  message: string
  statusCode?: number
  errors?: Record<string, string[]>
}
