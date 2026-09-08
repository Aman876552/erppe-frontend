export interface ClientLocationSummary {
  id: number | string
  clientId: number | string
  locationName: string
  level?: string | null
  contactPerson?: string | null
  phone?: string | null
  deliveryAddress?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  country?: string | null
  dispatchInstruction?: string | null
  transportTerms?: string | null
  taxShippingInfo?: string | null
  isPrimary?: boolean
}

export interface Order {
  id: number | string
  orderNo: string
  clientId: string
  clientLocationId?: string | number | null
  clientLocation?: ClientLocationSummary | null
  clientPoRef?: string | null
  orderDate?: string | null
  commercialTerms?: string | null
  taxAndCurrency?: string | null
  billingLocation?: string | null
  orderManagerId?: string | null
  assignedManager?: string | null
  overallDeadline?: string | null
  notes?: string | null
  rawData?: string | null
  status: string
  totalAmount: number
  frozenAt?: string | null
  createdBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateOrderPayload {
  orderNo: string
  clientId: string
  clientLocationId?: string | number | null
  clientPoRef?: string
  orderDate?: string
  commercialTerms?: string
  taxAndCurrency?: string
  billingLocation?: string
  orderManagerId?: string
  assignedManager?: string
  overallDeadline?: string
  notes?: string
  rawData?: string
  status?: string
  totalAmount?: number
  frozenAt?: string | null
  locations?: Array<any>
}

export interface UpdateOrderPayload extends Partial<CreateOrderPayload> {}

export interface OrderQueryParams {
  search?: string
  orderNo?: string
  clientId?: string
  status?: string
  orderManagerId?: string
}

export const ORDER_STATUSES = [
  "Draft",
  "Confirmed",
  "In Production",
  "Dispatched",
  "Completed",
  "Cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
