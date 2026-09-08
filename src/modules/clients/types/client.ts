export interface ClientLocation {
  id?: string | number
  clientId?: string | number
  name?: string
  locationName?: string
  level?: string
  contact?: string
  contactPerson?: string
  phone?: string
  address?: string
  deliveryAddress?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  billingMode?: "global" | "custom"
  billingName?: string
  billingGst?: string
  billingAddress?: string
  billingState?: string
  bankName?: string
  bankAccount?: string
  bankIfsc?: string
  bankHolder?: string
  isPrimary?: boolean
  dispatchInstruction?: string
  transportTerms?: string
  taxShippingInfo?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface ClientDocumentItem {
  id: number | string
  file_name: string
  mime_type?: string
  size?: number
  url?: string
}

export type ClientDocumentsMap = Record<string, ClientDocumentItem | null>

export interface ClientDetails {
  clientCode: string
  tradeName: string
  legalEntity: string
  incorporationDate: string
  industry: string
  nature: string
  pan: string
  tan: string
  gst: string
  cin: string
  msme: string
  iec: string
  authSignatory: string
  hrManager: string
  accountsContact: string
  complianceOfficer: string
  emergencyName: string
  emergencyCode: string
  emergencyMobile: string
  registeredAddress: string
  corporateAddress: string
  factoryAddress: string
  country: string
  district: string
  billingName: string
  billingGst: string
  billingState: string
  billingAddress: string
  bankName: string
  bankAccount: string
  bankIfsc: string
  bankHolder: string
  documents?: ClientDocumentsMap
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

  // Master Details Extended Properties
  tradeName?: string
  legalEntity?: string
  incorporationDate?: string
  industry?: string
  nature?: string
  pan?: string
  tan?: string
  gst?: string
  cin?: string
  msme?: string
  iec?: string
  authSignatory?: string
  hrManager?: string
  accountsContact?: string
  complianceOfficer?: string
  emergencyName?: string
  emergencyCode?: string
  emergencyMobile?: string
  registeredAddress?: string
  corporateAddress?: string
  factoryAddress?: string
  country?: string
  district?: string
  billingName?: string
  billingGst?: string
  billingState?: string
  billingAddress?: string
  bankName?: string
  bankAccount?: string
  bankIfsc?: string
  bankHolder?: string

  // Spatie MediaLibrary Document Media IDs / URLs
  panCard?: number | string | null
  gstCertificate?: number | string | null
  cinIncorporation?: number | string | null
  msmeUdyam?: number | string | null
  iecCertificate?: number | string | null
  cancelledCheque?: number | string | null
  agreementContract?: number | string | null
  otherCompliance?: number | string | null

  // Computed Documents Map from Backend
  documents?: ClientDocumentsMap

  locations?: ClientLocation[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateClientPayload extends Partial<ClientDetails> {
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
