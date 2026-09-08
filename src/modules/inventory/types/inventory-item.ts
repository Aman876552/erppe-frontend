export interface InventoryItem {
  id: string | number
  code: string
  name: string
  type?: string | null
  unit?: string | null
  quantity?: number | null
  reorderLevel?: number | null
  location?: string | null
  warehouse?: string | null
  store?: string | null
  rack?: string | null
  row?: string | null
  hsn?: string | null
  purchasePrice?: number | null
  sellingPrice?: number | null
  materialType?: string | null
  size?: string | null
  grade?: string | null
  special?: string | null
  remarks?: string | null
  isActive?: boolean | null
  needsSetup?: boolean | null
  productId?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateInventoryItemPayload {
  code: string
  name: string
  type?: string | null
  unit?: string | null
  quantity?: number | null
  reorderLevel?: number | null
  location?: string | null
  warehouse?: string | null
  store?: string | null
  rack?: string | null
  row?: string | null
  hsn?: string | null
  purchasePrice?: number | null
  sellingPrice?: number | null
  materialType?: string | null
  size?: string | null
  grade?: string | null
  special?: string | null
  remarks?: string | null
  isActive?: boolean | null
  needsSetup?: boolean | null
  productId?: string | null
}

export interface UpdateInventoryItemPayload extends Partial<CreateInventoryItemPayload> {}

export interface InventoryQueryParams {
  search?: string
  code?: string
  name?: string
  type?: string
  warehouse?: string
  location?: string
  materialType?: string
  productId?: string
  isActive?: boolean | string
  needsSetup?: boolean | string
  sort_by?: "id" | "code" | "name" | "quantity" | "reorderLevel" | "purchasePrice" | "sellingPrice" | "createdAt" | "updatedAt" | string
  sort_order?: "asc" | "desc"
  per_page?: number
  limit?: number
  page?: number
  paginate?: boolean | string
}

export interface PaginatedInventoryResponse {
  data: InventoryItem[]
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
  meta?: {
    current_page?: number
    from?: number
    last_page?: number
    path?: string
    per_page?: number
    to?: number
    total?: number
    [key: string]: any
  }
}
