export interface DepartmentOption {
  id: number | string
  name: string
  [key: string]: any
}

export interface VendorOption {
  id: number | string
  name: string
  vendorCode?: string
  [key: string]: any
}

export interface Machine {
  id: string | number
  machineId?: string | null
  machineName: string
  brandName: string
  modelNumber?: string | null
  serialNumber?: string | null
  departmentId: number
  status?: string | null
  purchaseDate: string
  purchaseYear?: number | null
  vendorName: string
  vendorId?: number | null
  machinePoNumber?: string | null
  purchaseAmount: number | string
  warrantyExpiryDate?: string | null
  engineerName?: string | null
  engineerEmail?: string | null
  engineerContact?: string | null
  department?: DepartmentOption | null
  vendor?: VendorOption | null
  createdBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateMachinePayload {
  machineName: string
  brandName: string
  modelNumber?: string | null
  serialNumber?: string | null
  departmentId: number
  status?: string | null
  purchaseDate: string
  vendorName: string
  vendorId?: number | null
  machinePoNumber?: string | null
  purchaseAmount: number
  warrantyExpiryDate?: string | null
  engineerName?: string | null
  engineerEmail?: string | null
  engineerContact?: string | null
}

export interface UpdateMachinePayload extends Partial<CreateMachinePayload> {
  machineId?: string | null
}

export interface MachineQueryParams {
  search?: string
  status?: string
  departmentId?: number | string
  department_id?: number | string
  vendorId?: number | string
  vendor_id?: number | string
  purchaseYear?: number | string
  purchase_year?: number | string
  brandName?: string
  brand_name?: string
  sort_by?: "id" | "machineId" | "machineName" | "brandName" | "purchaseDate" | "purchaseYear" | "purchaseAmount" | "status" | "createdAt" | string
  sort_order?: "asc" | "desc"
  per_page?: number
  limit?: number
  page?: number
  paginate?: boolean | string
}

export interface PaginatedMachineResponse {
  data: Machine[]
  links?: any
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
    [key: string]: any
  }
}
