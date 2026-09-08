"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { productsApi } from "@/modules/products/lib/products-api"
import { Product, CreateProductPayload, ProductQueryParams } from "@/modules/products/types/product"
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  IndianRupee,
  Layers,
  FileText,
  Tag,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  ShoppingCart,
  Boxes,
  Sparkles,
} from "lucide-react"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [copiedSku, setCopiedSku] = useState<string | null>(null)

  // Server Filter State
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [itemLevelFilter, setItemLevelFilter] = useState("all")
  const [orderableFilter, setOrderableFilter] = useState("all")

  // Client-side Sorting & Pagination State
  const [sortBy, setSortBy] = useState<string>("sku")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Form State & Client Validation
  const [skuWarning, setSkuWarning] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProductPayload>({
    sku: "",
    name: "",
    productCode: "",
    globalId: "",
    category: "",
    itemLevel: "FINISHED",
    sapNo: "",
    upcCode: "",
    drawingNo: "",
    drawingUrl: "",
    unit: "Pcs",
    pcsPerUnit: 1,
    weight: null,
    inWeight: null,
    productType: "",
    materialType: "",
    size: "",
    grade: "",
    special: "",
    remarks: "",
    unitCost: null,
    sellingCost: null,
    totalQty: null,
    totalWeight: null,
    singleWeight: null,
    clientDescription: "",
    materialProcess: "",
    stockQty: 0,
    unitsSold: 0,
    ordersReceived: 0,
    isOrderable: true,
  })

  // Debounce search input (~300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt)
    setCopiedSku(txt)
    setTimeout(() => setCopiedSku(null), 2000)
  }

  // Fetch Products from API
  const fetchProducts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: ProductQueryParams = {
        search: debouncedSearch.trim() || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        itemLevel: itemLevelFilter !== "all" ? itemLevelFilter : undefined,
        isOrderable: orderableFilter === "true" ? true : orderableFilter === "false" ? false : undefined,
      }

      const res = await productsApi.getProducts(params)
      setProducts(res.data || [])
    } catch (err: any) {
      console.error("Error fetching product catalog:", err)
      setError(err.message || "Could not load products from backend API.")
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [debouncedSearch, categoryFilter, itemLevelFilter, orderableFilter])

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[]
  }, [products])

  // Client-side Sorting & Local filtering
  const processedProducts = useMemo(() => {
    let list = [...products]

    // Sort list
    list.sort((a, b) => {
      let aVal: any = (a as any)[sortBy]
      let bVal: any = (b as any)[sortBy]

      if (aVal === null || aVal === undefined) aVal = ""
      if (bVal === null || bVal === undefined) bVal = ""

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal
      }

      const strA = String(aVal).toLowerCase()
      const strB = String(bVal).toLowerCase()
      return sortOrder === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA)
    })

    return list
  }, [products, sortBy, sortOrder])

  // Client-side Pagination calculations
  const totalRecords = processedProducts.length
  const totalPages = Math.ceil(totalRecords / pageSize) || 1
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize
    return processedProducts.slice(startIdx, startIdx + pageSize)
  }, [processedProducts, currentPage, pageSize])

  // Calculations for Metric Cards
  const totalStockQtySum = products.reduce((sum, p) => sum + (Number(p.stockQty) || 0), 0)
  const totalUnitsSoldSum = products.reduce((sum, p) => sum + (Number(p.unitsSold) || 0), 0)
  const orderableCount = products.filter((p) => p.isOrderable !== false).length

  // Check client SKU uniqueness
  const handleCheckSkuUniqueness = (skuVal: string, ignoreId?: string | number) => {
    if (!skuVal.trim()) {
      setSkuWarning(null)
      return
    }

    const exists = products.some(
      (p) => p.sku.toLowerCase() === skuVal.trim().toLowerCase() && String(p.id) !== String(ignoreId)
    )
    if (exists) {
      setSkuWarning("Notice: This SKU already exists in the current product catalog.")
    } else {
      setSkuWarning(null)
    }
  }

  // Open Create Modal
  const handleOpenAdd = () => {
    setSkuWarning(null)
    setError(null)
    setFormData({
      sku: "",
      name: "",
      productCode: "",
      globalId: "",
      category: "",
      itemLevel: "FINISHED",
      sapNo: "",
      upcCode: "",
      drawingNo: "",
      drawingUrl: "",
      unit: "Pcs",
      pcsPerUnit: 1,
      weight: null,
      inWeight: null,
      productType: "",
      materialType: "",
      size: "",
      grade: "",
      special: "",
      remarks: "",
      unitCost: null,
      sellingCost: null,
      totalQty: null,
      totalWeight: null,
      singleWeight: null,
      clientDescription: "",
      materialProcess: "",
      stockQty: 0,
      unitsSold: 0,
      ordersReceived: 0,
      isOrderable: true,
    })
    setIsAddOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setSkuWarning(null)
    setError(null)
    setFormData({
      sku: p.sku || "",
      name: p.name || "",
      productCode: p.productCode || "",
      globalId: p.globalId || "",
      category: p.category || "",
      itemLevel: p.itemLevel || "FINISHED",
      sapNo: p.sapNo || "",
      upcCode: p.upcCode || "",
      drawingNo: p.drawingNo || "",
      drawingUrl: p.drawingUrl || "",
      unit: p.unit || "Pcs",
      pcsPerUnit: p.pcsPerUnit ?? 1,
      weight: p.weight ?? null,
      inWeight: p.inWeight ?? null,
      productType: p.productType || "",
      materialType: p.materialType || "",
      size: p.size || "",
      grade: p.grade || "",
      special: p.special || "",
      remarks: p.remarks || "",
      unitCost: p.unitCost ?? null,
      sellingCost: p.sellingCost ?? null,
      totalQty: p.totalQty ?? null,
      totalWeight: p.totalWeight ?? null,
      singleWeight: p.singleWeight ?? null,
      clientDescription: p.clientDescription || "",
      materialProcess: p.materialProcess || "",
      stockQty: p.stockQty ?? 0,
      unitsSold: p.unitsSold ?? 0,
      ordersReceived: p.ordersReceived ?? 0,
      isOrderable: p.isOrderable ?? true,
    })
  }

  // Submit Create Product: POST /api/products
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.sku.trim() || !formData.name.trim()) return

    setIsSubmittingAdd(true)
    setError(null)

    try {
      const payload: CreateProductPayload = {
        ...formData,
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        // Numeric doubles
        pcsPerUnit: formData.pcsPerUnit !== null && formData.pcsPerUnit !== undefined ? Number(formData.pcsPerUnit) : null,
        weight: formData.weight !== null && formData.weight !== undefined ? Number(formData.weight) : null,
        inWeight: formData.inWeight !== null && formData.inWeight !== undefined ? Number(formData.inWeight) : null,
        unitCost: formData.unitCost !== null && formData.unitCost !== undefined ? Number(formData.unitCost) : null,
        sellingCost: formData.sellingCost !== null && formData.sellingCost !== undefined ? Number(formData.sellingCost) : null,
        totalQty: formData.totalQty !== null && formData.totalQty !== undefined ? Number(formData.totalQty) : null,
        totalWeight: formData.totalWeight !== null && formData.totalWeight !== undefined ? Number(formData.totalWeight) : null,
        singleWeight: formData.singleWeight !== null && formData.singleWeight !== undefined ? Number(formData.singleWeight) : null,
        // Integers
        stockQty: Math.floor(Number(formData.stockQty) || 0),
        unitsSold: Math.floor(Number(formData.unitsSold) || 0),
        ordersReceived: Math.floor(Number(formData.ordersReceived) || 0),
        isOrderable: Boolean(formData.isOrderable),
      }

      const res = await productsApi.createProduct(payload)
      setProducts((prev) => [res.data, ...prev])
      showNotification(res.message || `Product SKU "${formData.sku}" created successfully.`)
      setIsAddOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create product.")
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Submit Update Product: PUT /api/products/{id}
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        pcsPerUnit: formData.pcsPerUnit !== null && formData.pcsPerUnit !== undefined ? Number(formData.pcsPerUnit) : null,
        weight: formData.weight !== null && formData.weight !== undefined ? Number(formData.weight) : null,
        inWeight: formData.inWeight !== null && formData.inWeight !== undefined ? Number(formData.inWeight) : null,
        unitCost: formData.unitCost !== null && formData.unitCost !== undefined ? Number(formData.unitCost) : null,
        sellingCost: formData.sellingCost !== null && formData.sellingCost !== undefined ? Number(formData.sellingCost) : null,
        totalQty: formData.totalQty !== null && formData.totalQty !== undefined ? Number(formData.totalQty) : null,
        totalWeight: formData.totalWeight !== null && formData.totalWeight !== undefined ? Number(formData.totalWeight) : null,
        singleWeight: formData.singleWeight !== null && formData.singleWeight !== undefined ? Number(formData.singleWeight) : null,
        stockQty: Math.floor(Number(formData.stockQty) || 0),
        unitsSold: Math.floor(Number(formData.unitsSold) || 0),
        ordersReceived: Math.floor(Number(formData.ordersReceived) || 0),
        isOrderable: Boolean(formData.isOrderable),
      }

      const res = await productsApi.updateProduct(editingProduct.id, payload)
      setProducts((prev) =>
        prev.map((p) => (String(p.id) === String(editingProduct.id) ? { ...p, ...res.data } : p))
      )
      showNotification(res.message || `Product SKU "${editingProduct.sku}" updated successfully.`)
      setEditingProduct(null)
    } catch (err: any) {
      setError(err.message || "Failed to update product.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Submit Delete Product: DELETE /api/products/{id}
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      const res = await productsApi.deleteProduct(deletingProduct.id)
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(deletingProduct.id)))
      showNotification(res.message || `Product SKU "${deletingProduct.sku}" removed successfully.`)
      setDeletingProduct(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete product.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Columns definition for DataTable
  const columns: Column<Product>[] = [
    {
      key: "sku",
      title: "SKU & Product Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
            <Package className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-xs">{row.name}</span>
              <button
                type="button"
                onClick={() => handleCopy(row.sku)}
                className="inline-flex items-center gap-1 font-mono text-[10px] bg-muted/60 hover:bg-muted text-foreground px-1.5 py-0.5 rounded border border-border transition-colors font-semibold"
                title="Click to copy SKU"
              >
                <span>{row.sku}</span>
                {copiedSku === row.sku ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
              {row.productCode && <span>Code: <strong className="text-foreground">{row.productCode}</strong></span>}
              {row.sapNo && <span>• SAP: <strong className="text-foreground font-mono">{row.sapNo}</strong></span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: "Category & Level",
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground">{row.category || "Unassigned"}</div>
          <Badge variant="secondary" className="font-mono text-[9px] px-2 py-0.5 font-bold">
            {row.itemLevel || "FINISHED"}
          </Badge>
        </div>
      ),
    },
    {
      key: "pricing",
      title: "Costs & Pricing (₹)",
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="text-foreground font-medium">
            <span className="text-[10px] text-muted-foreground font-sans">Cost: </span>
            {row.unitCost !== null && row.unitCost !== undefined ? `₹${Number(row.unitCost).toFixed(2)}` : "—"}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="text-[10px] text-muted-foreground font-sans">Sell: </span>
            {row.sellingCost !== null && row.sellingCost !== undefined ? `₹${Number(row.sellingCost).toFixed(2)}` : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "counters",
      title: "Stock & Performance",
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-muted-foreground text-[10px]">Stock:</span>
            <strong className="text-foreground">{Number(row.stockQty || 0).toLocaleString()}</strong>
            <span className="text-[10px] text-muted-foreground font-sans">{row.unit || "Pcs"}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span>Sold: <strong className="text-foreground">{Number(row.unitsSold || 0).toLocaleString()}</strong></span>
            <span>• Orders: <strong className="text-foreground">{Number(row.ordersReceived || 0).toLocaleString()}</strong></span>
          </div>
        </div>
      ),
    },
    {
      key: "drawing",
      title: "Drawing No / Doc",
      render: (row) => (
        <div className="text-xs">
          {row.drawingNo ? (
            <div className="font-mono font-medium text-foreground text-[11px]">{row.drawingNo}</div>
          ) : (
            <span className="text-muted-foreground text-[11px]">—</span>
          )}
          {row.drawingUrl && (
            <a
              href={row.drawingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold mt-0.5"
            >
              <ExternalLink className="h-3 w-3" /> View Drawing
            </a>
          )}
        </div>
      ),
    },
    {
      key: "isOrderable",
      title: "Orderable Status",
      render: (row) => (
        <div>
          {row.isOrderable !== false ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold text-[10px]">
              Orderable
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30 text-[10px]">
              Hidden
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Product Spec Sheet">
            <Link href={`/products/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit Product Details"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete Product"
            onClick={() => setDeletingProduct(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Product Master Catalog"
        description="Manage product SKUs, engineering drawings, costs, item levels, orderability flags, and sales performance."
        badge={<Badge variant="info">{totalRecords} Products Total</Badge>}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleOpenAdd} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Add Product SKU
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Catalog SKUs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalRecords}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Active product entries</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Orderable Products</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{orderableCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Available for orders & quotes</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Stock Units</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {totalStockQtySum.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Sum of stockQty column</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Cumulative Units Sold</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {totalUnitsSoldSum.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Total units fulfilled</span>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <Card className="p-4 border border-border/60 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search name, SKU, product code, SAP no, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Item Level Filter */}
            <select
              value={itemLevelFilter}
              onChange={(e) => {
                setItemLevelFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Item Levels</option>
              <option value="FINISHED">FINISHED</option>
              <option value="SEMI">SEMI-FINISHED</option>
              <option value="RAW">RAW Material</option>
            </select>

            {/* Orderable Filter */}
            <select
              value={orderableFilter}
              onChange={(e) => {
                setOrderableFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Orderable: All</option>
              <option value="true">Orderable Only</option>
              <option value="false">Hidden Only</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              className="h-9 gap-1.5 text-xs"
              title="Refresh product list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Client-side Sort & Page Size Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-primary" /> Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-8 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none"
            >
              <option value="sku">SKU Code</option>
              <option value="name">Product Name</option>
              <option value="category">Category</option>
              <option value="stockQty">Stock Quantity</option>
              <option value="sellingCost">Selling Price</option>
              <option value="unitsSold">Units Sold</option>
              <option value="createdAt">Created Date</option>
            </select>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-foreground"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder.toUpperCase()}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-8 rounded border border-input bg-background px-2 text-xs text-foreground focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={paginatedProducts}
        keyExtractor={(row) => String(row.id)}
        isLoading={isLoading}
      />

      {/* Client-side Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs">
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalRecords} items total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal 1: Create New Product */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Product Master SKU" maxWidth="lg">
        <form onSubmit={handleCreateProduct} className="space-y-4 mt-2">
          {skuWarning && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{skuWarning}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Product SKU <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. FG-BRKT-1001"
                value={formData.sku}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                  handleCheckSkuUniqueness(e.target.value)
                }}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Mounting Bracket L-Type"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Code</label>
              <Input
                placeholder="BRKT-L-01"
                value={formData.productCode || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, productCode: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <Input
                placeholder="Brackets"
                value={formData.category || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Item Level</label>
              <select
                value={formData.itemLevel || "FINISHED"}
                onChange={(e) => setFormData((prev) => ({ ...prev, itemLevel: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="FINISHED">FINISHED</option>
                <option value="SEMI">SEMI-FINISHED</option>
                <option value="RAW">RAW Material</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">SAP No</label>
              <Input
                placeholder="SAP-55231"
                value={formData.sapNo || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, sapNo: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">UPC / Barcode</label>
              <Input
                placeholder="8901234567890"
                value={formData.upcCode || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, upcCode: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Drawing No</label>
              <Input
                placeholder="DRW-BRKT-L-01-R2"
                value={formData.drawingNo || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, drawingNo: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Drawing Document URL</label>
            <Input
              placeholder="https://files.example.com/drawings/brkt-l-01.pdf"
              value={formData.drawingUrl || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, drawingUrl: e.target.value }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Unit of Measure</label>
              <Input
                placeholder="Pcs"
                value={formData.unit || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Pcs Per Unit</label>
              <Input
                type="number"
                step="any"
                placeholder="1"
                value={formData.pcsPerUnit ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pcsPerUnit: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Weight (kg)</label>
              <Input
                type="number"
                step="any"
                placeholder="0.42"
                value={formData.weight ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    weight: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">In-Weight (kg)</label>
              <Input
                type="number"
                step="any"
                placeholder="0.40"
                value={formData.inWeight ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    inWeight: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Unit Cost (₹)</label>
              <Input
                type="number"
                step="any"
                placeholder="34.50"
                value={formData.unitCost ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unitCost: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Selling Cost (₹)</label>
              <Input
                type="number"
                step="any"
                placeholder="52.00"
                value={formData.sellingCost ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sellingCost: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Stock Qty (Integer)</label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={formData.stockQty ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockQty: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Units Sold (Integer)</label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={formData.unitsSold ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unitsSold: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Orders Received (Integer)</label>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={formData.ordersReceived ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ordersReceived: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Type</label>
              <Input
                placeholder="Fabricated"
                value={formData.productType || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, productType: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Material Type</label>
              <Input
                placeholder="Mild Steel"
                value={formData.materialType || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, materialType: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Size / Dimensions</label>
              <Input
                placeholder="120 x 80 x 3 mm"
                value={formData.size || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Grade</label>
              <Input
                placeholder="IS 2062"
                value={formData.grade || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Special Finish / Treatment</label>
              <Input
                placeholder="Powder coated black"
                value={formData.special || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, special: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Material Process</label>
            <Input
              placeholder="Laser cut → bend → powder coat"
              value={formData.materialProcess || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, materialProcess: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Client Description</label>
            <Input
              placeholder="L-shaped mounting bracket"
              value={formData.clientDescription || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientDescription: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remarks / Catalog Notes</label>
            <Input
              placeholder="Standard catalog item"
              value={formData.remarks || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={formData.isOrderable ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, isOrderable: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Is Orderable (Available in Quote & Order Pickers)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Product
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Product */}
      <Dialog open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} title="Edit Product Details" maxWidth="lg">
        <form onSubmit={handleUpdateProduct} className="space-y-4 mt-2">
          {skuWarning && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{skuWarning}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                  if (editingProduct) handleCheckSkuUniqueness(e.target.value, editingProduct.id)
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Code</label>
              <Input
                value={formData.productCode || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, productCode: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <Input
                value={formData.category || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Item Level</label>
              <select
                value={formData.itemLevel || "FINISHED"}
                onChange={(e) => setFormData((prev) => ({ ...prev, itemLevel: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground"
              >
                <option value="FINISHED">FINISHED</option>
                <option value="SEMI">SEMI-FINISHED</option>
                <option value="RAW">RAW Material</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Unit Cost (₹)</label>
              <Input
                type="number"
                step="any"
                value={formData.unitCost ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unitCost: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Selling Cost (₹)</label>
              <Input
                type="number"
                step="any"
                value={formData.sellingCost ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sellingCost: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Stock Qty (Integer)</label>
              <Input
                type="number"
                step="1"
                value={formData.stockQty ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    stockQty: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Units Sold (Integer)</label>
              <Input
                type="number"
                step="1"
                value={formData.unitsSold ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    unitsSold: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Orders Received (Integer)</label>
              <Input
                type="number"
                step="1"
                value={formData.ordersReceived ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ordersReceived: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Drawing Document URL</label>
            <Input
              value={formData.drawingUrl || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, drawingUrl: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={formData.isOrderable ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, isOrderable: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Is Orderable</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Product */}
      <Dialog open={Boolean(deletingProduct)} onClose={() => setDeletingProduct(null)} title="Delete Product Master Entry">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove product SKU{" "}
            <strong className="text-foreground font-semibold">"{deletingProduct?.sku}"</strong> (
            {deletingProduct?.name})?
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Product
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
