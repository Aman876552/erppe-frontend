export interface Product {
  id: string | number
  sku: string
  name: string
  globalId?: string | null
  productCode?: string | null
  category?: string | null
  itemLevel?: string | null
  sapNo?: string | null
  upcCode?: string | null
  drawingNo?: string | null
  drawingUrl?: string | null
  unit?: string | null
  pcsPerUnit?: number | null
  weight?: number | null
  inWeight?: number | null
  productType?: string | null
  materialType?: string | null
  size?: string | null
  grade?: string | null
  special?: string | null
  remarks?: string | null
  unitCost?: number | null
  sellingCost?: number | null
  totalQty?: number | null
  totalWeight?: number | null
  singleWeight?: number | null
  clientDescription?: string | null
  materialProcess?: string | null
  stockQty?: number | null
  unitsSold?: number | null
  ordersReceived?: number | null
  isOrderable?: boolean | null
  createdBy?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateProductPayload {
  sku: string
  name: string
  globalId?: string | null
  productCode?: string | null
  category?: string | null
  itemLevel?: string | null
  sapNo?: string | null
  upcCode?: string | null
  drawingNo?: string | null
  drawingUrl?: string | null
  unit?: string | null
  pcsPerUnit?: number | null
  weight?: number | null
  inWeight?: number | null
  productType?: string | null
  materialType?: string | null
  size?: string | null
  grade?: string | null
  special?: string | null
  remarks?: string | null
  unitCost?: number | null
  sellingCost?: number | null
  totalQty?: number | null
  totalWeight?: number | null
  singleWeight?: number | null
  clientDescription?: string | null
  materialProcess?: string | null
  stockQty?: number | null
  unitsSold?: number | null
  ordersReceived?: number | null
  isOrderable?: boolean | null
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface ProductQueryParams {
  search?: string
  sku?: string
  productCode?: string
  category?: string
  itemLevel?: string
  isOrderable?: boolean | string
}
