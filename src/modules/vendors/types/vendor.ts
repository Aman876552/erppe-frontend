export interface Vendor {
  id: string | number
  vendorCode?: string
  name: string
  phone?: string
  contact?: string
  email?: string
  address?: string
  pinCode?: string
  city?: string
  state?: string
  country?: string
  panNo?: string
  gstin?: string
  ordersCount?: number
  totalSpend?: number | string
  lastOrderOn?: string
  lastOrderItem?: string
  notes?: string
  rawData?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateVendorPayload {
  name: string
  vendorCode?: string
  phone?: string
  contact?: string
  email?: string
  address?: string
  pinCode?: string
  city?: string
  state?: string
  country?: string
  panNo?: string
  gstin?: string
  notes?: string
  rawData?: string
  ordersCount?: number
  totalSpend?: number
  lastOrderOn?: string
  lastOrderItem?: string
}

export interface UpdateVendorPayload extends Partial<CreateVendorPayload> {}

export interface VendorQueryParams {
  page?: number
  pageSize?: number
  per_page?: number
  limit?: number
  search?: string
  city?: string
  state?: string
  name?: string
  vendorCode?: string
  email?: string
}
