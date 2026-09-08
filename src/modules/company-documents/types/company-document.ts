export interface CompanyDocumentMedia {
  id: string | number
  name: string
  file_name: string
  mime_type: string
  size: number
  url: string
}

export interface CompanyDocument {
  id: string | number
  documentName: string
  attachmentMediaId?: string | number | null
  isPrivate?: boolean
  issueDate?: string | null
  expiryDate?: string | null
  reminderBeforeExpiry?: string | null
  createdBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  attachmentUrl?: string | null
  media?: CompanyDocumentMedia | null
}

export interface CreateCompanyDocumentPayload {
  documentName: string
  isPrivate?: boolean
  issueDate?: string
  expiryDate?: string
  reminderBeforeExpiry?: string
  attachment?: File | null
}

export interface BulkCreateCompanyDocumentsPayload {
  documents: CreateCompanyDocumentPayload[]
}

export interface UpdateCompanyDocumentPayload extends Partial<CreateCompanyDocumentPayload> {}

export interface CompanyDocumentQueryParams {
  search?: string
  documentName?: string
  isPrivate?: boolean | number | string
  expiringSoon?: boolean | number | string
}
