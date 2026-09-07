export type FabricatorStatus = "Active" | "Inactive"

export interface Fabricator {
  id: string | number
  fabricatorName: string
  contactPerson: string
  mobileNumber: string
  fabricationType: string
  email?: string
  address?: string
  city?: string
  gstNumber?: string
  status?: FabricatorStatus
  remarks?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateFabricatorPayload {
  fabricatorName: string
  contactPerson: string
  mobileNumber: string
  fabricationType: string
  email?: string
  address?: string
  city?: string
  gstNumber?: string
  status?: FabricatorStatus
  remarks?: string
}

export interface UpdateFabricatorPayload extends Partial<CreateFabricatorPayload> {}

export interface FabricatorQueryParams {
  search?: string
  fabricatorName?: string
  fabricationType?: string
  status?: FabricatorStatus | string
}
