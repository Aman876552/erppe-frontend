export interface ClientLocation {
  id?: string | number
  clientId?: string | number
  locationName: string
  contactPerson?: string
  deliveryAddress?: string
  dispatchInstruction?: string
  transportTerms?: string
  taxShippingInfo?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface ClientDocumentFiles {
  panCard?: File | null
  gstCertificate?: File | null
  cinIncorporation?: File | null
  msmeUdyam?: File | null
  iecCertificate?: File | null
  cancelledCheque?: File | null
  agreementContract?: File | null
  otherCompliance?: File | null
}

export interface Client {
  id: string | number
  clientCode: string
  name: string
  contact?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  status?: string
  ordersCount?: number
  avgOrderAmount?: number | string
  lastOrderOn?: string
  pendingPayment?: number | string
  notes?: string
  rawData?: string

  // Spatie MediaLibrary Document Media IDs / URLs
  panCard?: number | string | null
  gstCertificate?: number | string | null
  cinIncorporation?: number | string | null
  msmeUdyam?: number | string | null
  iecCertificate?: number | string | null
  cancelledCheque?: number | string | null
  agreementContract?: number | string | null
  otherCompliance?: number | string | null

  locations?: ClientLocation[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateClientPayload {
  clientCode: string
  name: string
  contact?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  status?: string
  notes?: string
  rawData?: string
  ordersCount?: number
  avgOrderAmount?: number
  pendingPayment?: number
  lastOrderOn?: string
  locations?: ClientLocation[]

  // Media IDs if resubmitted
  panCard?: number | string | null
  gstCertificate?: number | string | null
  cinIncorporation?: number | string | null
  msmeUdyam?: number | string | null
  iecCertificate?: number | string | null
  cancelledCheque?: number | string | null
  agreementContract?: number | string | null
  otherCompliance?: number | string | null
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {}

export interface ClientQueryParams {
  search?: string
  name?: string
  clientCode?: string
  email?: string
  status?: string
}
