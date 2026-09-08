export interface LeadItem {
  productName: string
  productCode?: string
  department?: string
  qty: number
}

export interface Lead {
  id: number | string
  leadCode?: string | null
  leadName: string
  name: string
  contactPerson?: string | null
  company?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  state?: string | null
  city?: string | null
  pincode?: string | null
  role?: string | null
  leadType?: string | null
  leadSource?: string | null
  leadPriority?: string | null
  delivery?: string | null
  estPrice?: number | null
  assignedTo?: string | null
  notes?: string | null
  rawData?: string | null
  status: string
  pipelineJson?: Record<string, any> | Array<any> | null
  items?: LeadItem[]
  createdBy?: string | number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateLeadPayload {
  leadCode?: string
  leadName: string
  name: string
  company?: string
  phone?: string
  whatsapp?: string
  email?: string
  address?: string
  state?: string
  city?: string
  pincode?: string
  role?: string
  leadType?: string
  leadSource?: string
  leadPriority?: string
  delivery?: string
  estPrice?: number
  assignedTo?: string
  notes?: string
  rawData?: string
  status?: string
  pipelineJson?: Record<string, any> | Array<any>
  items?: LeadItem[]
}

export interface UpdateLeadPayload extends Partial<CreateLeadPayload> {}

export interface LeadQueryParams {
  search?: string
  status?: string
  leadPriority?: string
  leadSource?: string
  assignedTo?: string
}

export const LEAD_STATUSES = ["New", "In Progress", "Qualified", "Converted", "Lost"] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_PRIORITIES = ["High", "Medium", "Low"] as const
export type LeadPriority = (typeof LEAD_PRIORITIES)[number]

export const LEAD_TYPES = ["Product", "Service", "Mixed", "Inbound"] as const
export type LeadType = (typeof LEAD_TYPES)[number]
