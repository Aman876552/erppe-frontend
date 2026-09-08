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
import { inventoryApi } from "@/modules/inventory/lib/inventory-api"
import {
  InventoryItem,
  CreateInventoryItemPayload,
  InventoryQueryParams,
} from "@/modules/inventory/types/inventory-item"
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Package,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Warehouse,
  IndianRupee,
  Layers,
  Wrench,
  Tag,
  AlertCircle,
  Copy,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Filters & Search State
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [needsSetupFilter, setNeedsSetupFilter] = useState("all")
  const [lowStockFilter, setLowStockFilter] = useState(false)

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<string>("updatedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Form State & Inline Validation
  const [codeError, setCodeError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateInventoryItemPayload>({
    code: "",
    name: "",
    type: "RAW",
    unit: "Pcs",
    quantity: 0,
    reorderLevel: 0,
    warehouse: "",
    location: "",
    store: "",
    rack: "",
    row: "",
    hsn: "",
    purchasePrice: null,
    sellingPrice: null,
    materialType: "",
    size: "",
    grade: "",
    special: "",
    remarks: "",
    isActive: true,
    needsSetup: false,
    productId: null,
  })

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Fetch Inventory Items
  const fetchInventory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: InventoryQueryParams = {
        search: search.trim() || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        warehouse: warehouseFilter !== "all" ? warehouseFilter : undefined,
        isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
        needsSetup: needsSetupFilter === "true" ? true : needsSetupFilter === "false" ? false : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        per_page: perPage,
        page: page,
      }

      const res = await inventoryApi.getInventoryItems(params)
      const fetchedList = Array.isArray(res.data) ? res.data : []
      setItems(fetchedList)
      
      if (res.meta) {
        setTotalItems(res.meta.total ?? fetchedList.length)
        setTotalPages(res.meta.last_page ?? Math.ceil((res.meta.total ?? fetchedList.length) / perPage) ?? 1)
      } else {
        setTotalItems(fetchedList.length)
        setTotalPages(Math.ceil(fetchedList.length / perPage) || 1)
      }
    } catch (err: any) {
      console.error("API load error fetching inventory records:", err)
      setError(err.message || "Failed to fetch inventory records from server.")
      setItems([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [search, typeFilter, warehouseFilter, statusFilter, needsSetupFilter, sortBy, sortOrder, page, perPage])

  // Auto-generate code helper
  const handleAutoGenerateCode = (currentType?: string, currentName?: string) => {
    const generated = inventoryApi.generateCode(currentType || formData.type || "RAW", currentName || formData.name || "")
    setFormData((prev) => ({ ...prev, code: generated }))
    setCodeError(null)
  }

  // Open Create Modal
  const handleOpenAdd = () => {
    const defaultCode = inventoryApi.generateCode("RAW", "")
    setCodeError(null)
    setError(null)
    setFormData({
      code: defaultCode,
      name: "",
      type: "RAW",
      unit: "Pcs",
      quantity: 0,
      reorderLevel: 0,
      warehouse: "WH-A",
      location: "Main Store",
      store: "S1",
      rack: "R1",
      row: "1",
      hsn: "",
      purchasePrice: null,
      sellingPrice: null,
      materialType: "",
      size: "",
      grade: "",
      special: "",
      remarks: "",
      isActive: true,
      needsSetup: false,
      productId: null,
    })
    setIsAddOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setCodeError(null)
    setError(null)
    setFormData({
      code: item.code || "",
      name: item.name || "",
      type: item.type || "RAW",
      unit: item.unit || "Pcs",
      quantity: item.quantity ?? 0,
      reorderLevel: item.reorderLevel ?? 0,
      warehouse: item.warehouse || "",
      location: item.location || "",
      store: item.store || "",
      rack: item.rack || "",
      row: item.row || "",
      hsn: item.hsn || "",
      purchasePrice: item.purchasePrice ?? null,
      sellingPrice: item.sellingPrice ?? null,
      materialType: item.materialType || "",
      size: item.size || "",
      grade: item.grade || "",
      special: item.special || "",
      remarks: item.remarks || "",
      isActive: item.isActive ?? true,
      needsSetup: item.needsSetup ?? false,
      productId: item.productId || null,
    })
  }

  // Submit Create Item: POST /api/inventory-items
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim()) {
      setCodeError("Item code is required.")
      return
    }
    if (!formData.name.trim()) return

    setIsSubmittingAdd(true)
    setCodeError(null)
    setError(null)

    try {
      const payload: CreateInventoryItemPayload = {
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        quantity: Number(formData.quantity) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        purchasePrice: formData.purchasePrice !== null && formData.purchasePrice !== undefined && formData.purchasePrice !== ("" as any)
          ? Number(formData.purchasePrice)
          : null,
        sellingPrice: formData.sellingPrice !== null && formData.sellingPrice !== undefined && formData.sellingPrice !== ("" as any)
          ? Number(formData.sellingPrice)
          : null,
      }

      const res = await inventoryApi.createInventoryItem(payload)
      setItems((prev) => [res.data, ...prev])
      showNotification(res.message || `Inventory item "${formData.code}" created successfully.`)
      setIsAddOpen(false)
    } catch (err: any) {
      if (err.errors?.code || (err.message && err.message.toLowerCase().includes("code"))) {
        setCodeError(err.errors?.code?.[0] || "Code already exists in the system.")
      } else {
        setError(err.message || "Failed to create inventory item.")
      }
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Submit Update Item: PUT /api/inventory-items/{id}
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!formData.code.trim()) {
      setCodeError("Item code cannot be empty.")
      return
    }

    setIsSubmittingEdit(true)
    setCodeError(null)
    setError(null)

    try {
      const payload = {
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        quantity: Number(formData.quantity) || 0,
        reorderLevel: Number(formData.reorderLevel) || 0,
        purchasePrice: formData.purchasePrice !== null && formData.purchasePrice !== undefined && formData.purchasePrice !== ("" as any)
          ? Number(formData.purchasePrice)
          : null,
        sellingPrice: formData.sellingPrice !== null && formData.sellingPrice !== undefined && formData.sellingPrice !== ("" as any)
          ? Number(formData.sellingPrice)
          : null,
      }

      const res = await inventoryApi.updateInventoryItem(editingItem.id, payload)
      setItems((prev) =>
        prev.map((item) => (String(item.id) === String(editingItem.id) ? { ...item, ...res.data } : item))
      )
      showNotification(res.message || `Inventory item "${formData.code}" updated successfully.`)
      setEditingItem(null)
    } catch (err: any) {
      if (err.errors?.code || (err.message && err.message.toLowerCase().includes("code"))) {
        setCodeError(err.errors?.code?.[0] || "Code already exists in the system.")
      } else {
        setError(err.message || "Failed to update inventory item.")
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Submit Delete Item: DELETE /api/inventory-items/{id}
  const handleDeleteItem = async () => {
    if (!deletingItem) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      const res = await inventoryApi.deleteInventoryItem(deletingItem.id)
      setItems((prev) => prev.filter((item) => String(item.id) !== String(deletingItem.id)))
      showNotification(res.message || `Inventory item "${deletingItem.code}" deleted successfully.`)
      setDeletingItem(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete inventory item.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Computed Warehouse List for filter dropdown
  const uniqueWarehouses = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.warehouse).filter(Boolean))) as string[]
  }, [items])

  // Filtered dataset for local low-stock and search refinement
  const processedItems = useMemo(() => {
    return items.filter((item) => {
      if (lowStockFilter) {
        const qty = Number(item.quantity) || 0
        const lvl = Number(item.reorderLevel) || 0
        const isLow = qty <= lvl && item.isActive !== false
        if (!isLow) return false
      }
      return true
    })
  }, [items, lowStockFilter])

  // Calculation Metrics
  const totalItemCount = processedItems.length
  const lowStockCount = items.filter(
    (i) => (Number(i.quantity) || 0) <= (Number(i.reorderLevel) || 0) && i.isActive !== false
  ).length
  const needsSetupCount = items.filter((i) => i.needsSetup === true).length
  const totalValuation = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.purchasePrice) || 0),
    0
  )

  // Columns definition for DataTable
  const columns: Column<InventoryItem>[] = [
    {
      key: "code",
      title: "Item Code & Description",
      sortable: true,
      render: (row) => {
        const qty = Number(row.quantity) || 0
        const lvl = Number(row.reorderLevel) || 0
        const isLowStock = qty <= lvl && row.isActive !== false

        return (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              <Boxes className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-xs">{row.name}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(row.code)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] bg-muted/60 hover:bg-muted text-foreground px-1.5 py-0.5 rounded border border-border transition-colors"
                  title="Click to copy code"
                >
                  <span>{row.code}</span>
                  {copiedCode === row.code ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                {row.materialType && (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    <Tag className="h-3 w-3 text-primary/70" />
                    {row.materialType}
                  </span>
                )}
                {row.size && <span>• Size: {row.size}</span>}
                {row.grade && <span>• Grade: {row.grade}</span>}
              </div>

              {/* Warning badges */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {isLowStock && (
                  <Badge variant="warning" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
                    <AlertTriangle className="h-3 w-3" /> Reorder Alert
                  </Badge>
                )}
                {row.needsSetup && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold">
                    <AlertCircle className="h-3 w-3" /> Needs Setup
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: "type",
      title: "Category & Unit",
      sortable: true,
      render: (row) => (
        <div className="space-y-1">
          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5 font-bold">
            {row.type || "RAW"}
          </Badge>
          <div className="text-[11px] text-muted-foreground">
            Unit: <strong className="text-foreground">{row.unit || "Pcs"}</strong>
            {row.hsn && <span className="ml-2 font-mono text-[10px]">HSN: {row.hsn}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "quantity",
      title: "Stock & Reorder Level",
      sortable: true,
      render: (row) => {
        const qty = Number(row.quantity) || 0
        const lvl = Number(row.reorderLevel) || 0
        const isLow = qty <= lvl && row.isActive !== false

        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-mono font-extrabold text-sm ${isLow ? "text-amber-500" : "text-foreground"}`}>
                {qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-muted-foreground">{row.unit || "Pcs"}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Reorder threshold: <strong>{lvl}</strong>
            </div>
          </div>
        )
      },
    },
    {
      key: "warehouse",
      title: "Warehouse & Storage Location",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Warehouse className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{row.warehouse || "Unassigned"}</span>
            {row.location && <span className="text-muted-foreground">({row.location})</span>}
          </div>
          {(row.store || row.rack || row.row) && (
            <div className="text-[10px] font-mono text-muted-foreground pl-5">
              Store: {row.store || "-"} | Rack: {row.rack || "-"} | Row: {row.row || "-"}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "pricing",
      title: "Pricing (Purchase / Selling)",
      render: (row) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="text-foreground font-medium">
            <span className="text-[10px] text-muted-foreground font-sans">Buy: </span>
            {row.purchasePrice !== null && row.purchasePrice !== undefined
              ? `₹${Number(row.purchasePrice).toFixed(2)}`
              : "—"}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] text-muted-foreground font-sans">Sell: </span>
            {row.sellingPrice !== null && row.sellingPrice !== undefined
              ? `₹${Number(row.sellingPrice).toFixed(2)}`
              : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <div>
          {row.isActive !== false ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold text-[10px]">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30 text-[10px]">
              Inactive
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
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Item Specs">
            <Link href={`/inventory/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit Inventory Item"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete Item"
            onClick={() => setDeletingItem(row)}
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
        title="Inventory Items & Raw Materials"
        description="Manage stock quantities, warehouse bin locations, pricing, material specifications, and reorder alerts."
        badge={<Badge variant="info">{totalItemCount} Items Total</Badge>}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleOpenAdd} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Add Inventory Item
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
            <span className="text-xs font-semibold text-muted-foreground">Total Inventory SKUs</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalItemCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Registered in stock list</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Low Stock Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-500">{lowStockCount}</div>
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 hover:underline text-left block"
          >
            {lowStockFilter ? "Showing low stock only (Click to clear)" : "Click to view low stock items"}
          </button>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Needs Setup</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{needsSetupCount}</div>
          <button
            type="button"
            onClick={() => setNeedsSetupFilter(needsSetupFilter === "true" ? "all" : "true")}
            className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 hover:underline text-left block"
          >
            {needsSetupFilter === "true" ? "Filtering Needs Setup (Click to reset)" : "Incomplete records requiring setup"}
          </button>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Stock Valuation</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Based on purchase price & qty</span>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <Card className="p-4 border border-border/60 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search code, name, type, location, warehouse, material..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Type */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="RAW">RAW Materials</option>
              <option value="FINISHED">Finished Goods</option>
              <option value="SEMI_FINISHED">Semi-Finished</option>
              <option value="CONSUMABLE">Consumables</option>
              <option value="PACKAGING">Packaging</option>
              <option value="SPARE">Spares</option>
            </select>

            {/* Filter by Warehouse */}
            {uniqueWarehouses.length > 0 && (
              <select
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Warehouses</option>
                {uniqueWarehouses.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Needs Setup Filter */}
            <select
              value={needsSetupFilter}
              onChange={(e) => {
                setNeedsSetupFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Setup State: All</option>
              <option value="true">Needs Setup</option>
              <option value="false">Complete Records</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchInventory}
              className="h-9 gap-1.5 text-xs"
              title="Refresh item list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Sort & Pagination options row */}
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
              <option value="updatedAt">Last Updated</option>
              <option value="name">Name</option>
              <option value="code">Item Code</option>
              <option value="quantity">Stock Quantity</option>
              <option value="reorderLevel">Reorder Threshold</option>
              <option value="purchasePrice">Purchase Price</option>
              <option value="sellingPrice">Selling Price</option>
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
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
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
        data={processedItems}
        keyExtractor={(row) => String(row.id)}
        isLoading={isLoading}
      />

      {/* Server Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs">
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalItems} items total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal 1: Create Inventory Item */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Inventory SKU" maxWidth="lg">
        <form onSubmit={handleCreateItem} className="space-y-4 mt-2">
          {codeError && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{codeError}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Item Code <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoGenerateCode()}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="h-3 w-3" /> Auto Code
                </button>
              </div>
              <Input
                placeholder="e.g. RM-STEEL-001"
                value={formData.code}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                  setCodeError(null)
                }}
                required
                className={codeError ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {codeError && <span className="text-[10px] text-red-500 font-semibold">{codeError}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Item Name / Description <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. MS Steel Sheet 2mm"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category Type</label>
              <select
                value={formData.type || "RAW"}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="RAW">RAW Material</option>
                <option value="FINISHED">Finished Good</option>
                <option value="SEMI_FINISHED">Semi-Finished</option>
                <option value="CONSUMABLE">Consumable</option>
                <option value="PACKAGING">Packaging</option>
                <option value="SPARE">Spare Part</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Unit of Measure</label>
              <Input
                placeholder="e.g. Kg, Pcs, Mtr, Box"
                value={formData.unit || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">HSN Code</label>
              <Input
                placeholder="e.g. 7208"
                value={formData.hsn || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, hsn: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Current Stock Quantity</label>
              <Input
                type="number"
                step="any"
                placeholder="0"
                value={formData.quantity ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: e.target.value === "" ? 0 : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reorder Level Threshold</label>
              <Input
                type="number"
                step="any"
                placeholder="0"
                value={formData.reorderLevel ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reorderLevel: e.target.value === "" ? 0 : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Purchase Price (₹)</label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 62.50"
                value={formData.purchasePrice ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Selling Price (₹)</label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 78.00"
                value={formData.sellingPrice ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-semibold text-foreground">Warehouse</label>
              <Input
                placeholder="WH-A"
                value={formData.warehouse || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, warehouse: e.target.value }))}
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-semibold text-foreground">Location</label>
              <Input
                placeholder="Main Store"
                value={formData.location || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-semibold text-foreground">Store</label>
              <Input
                placeholder="S1"
                value={formData.store || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, store: e.target.value }))}
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-semibold text-foreground">Rack</label>
              <Input
                placeholder="R4"
                value={formData.rack || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, rack: e.target.value }))}
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-semibold text-foreground">Row</label>
              <Input
                placeholder="3"
                value={formData.row || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, row: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Material Type</label>
              <Input
                placeholder="Mild Steel"
                value={formData.materialType || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, materialType: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Size / Dim</label>
              <Input
                placeholder="2mm x 4x8ft"
                value={formData.size || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Grade</label>
              <Input
                placeholder="IS 2062"
                value={formData.grade || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Special Attributes</label>
              <Input
                placeholder="Hot Rolled / Pressure Tested"
                value={formData.special || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, special: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Link UUID (productId)</label>
              <Input
                placeholder="36-char Product UUID (optional)"
                value={formData.productId || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, productId: e.target.value || null }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remarks / Supplier Notes</label>
            <Input
              placeholder="Primary supplier info, batch notes..."
              value={formData.remarks || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Is Active SKU</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={formData.needsSetup ?? false}
                onChange={(e) => setFormData((prev) => ({ ...prev, needsSetup: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Needs Setup (Incomplete Record)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Item
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Inventory Item */}
      <Dialog open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title="Edit Inventory Item" maxWidth="lg">
        <form onSubmit={handleUpdateItem} className="space-y-4 mt-2">
          {codeError && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{codeError}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Item Code</label>
              <Input
                value={formData.code}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                  setCodeError(null)
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Item Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category Type</label>
              <select
                value={formData.type || "RAW"}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground"
              >
                <option value="RAW">RAW Material</option>
                <option value="FINISHED">Finished Good</option>
                <option value="SEMI_FINISHED">Semi-Finished</option>
                <option value="CONSUMABLE">Consumable</option>
                <option value="PACKAGING">Packaging</option>
                <option value="SPARE">Spare Part</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Unit</label>
              <Input
                value={formData.unit || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">HSN Code</label>
              <Input
                value={formData.hsn || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, hsn: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Stock Quantity</label>
              <Input
                type="number"
                step="any"
                value={formData.quantity ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quantity: e.target.value === "" ? 0 : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reorder Level Threshold</label>
              <Input
                type="number"
                step="any"
                value={formData.reorderLevel ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reorderLevel: e.target.value === "" ? 0 : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Purchase Price (₹)</label>
              <Input
                type="number"
                step="any"
                value={formData.purchasePrice ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchasePrice: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Selling Price (₹)</label>
              <Input
                type="number"
                step="any"
                value={formData.sellingPrice ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Warehouse</label>
              <Input
                value={formData.warehouse || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, warehouse: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Location</label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Store</label>
              <Input
                value={formData.store || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, store: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Rack</label>
              <Input
                value={formData.rack || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, rack: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Row</label>
              <Input
                value={formData.row || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, row: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Material Type</label>
              <Input
                value={formData.materialType || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, materialType: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Size</label>
              <Input
                value={formData.size || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Grade</label>
              <Input
                value={formData.grade || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, grade: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remarks</label>
            <Input
              value={formData.remarks || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Is Active SKU</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={formData.needsSetup ?? false}
                onChange={(e) => setFormData((prev) => ({ ...prev, needsSetup: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Needs Setup</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Inventory Item */}
      <Dialog open={Boolean(deletingItem)} onClose={() => setDeletingItem(null)} title="Delete Inventory Item">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove item code{" "}
            <strong className="text-foreground font-semibold">"{deletingItem?.code}"</strong> (
            {deletingItem?.name})? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Item
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
