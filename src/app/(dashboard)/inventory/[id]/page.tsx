"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { inventoryApi } from "@/modules/inventory/lib/inventory-api"
import { InventoryItem } from "@/modules/inventory/types/inventory-item"
import {
  ArrowLeft,
  Boxes,
  Warehouse,
  IndianRupee,
  Tag,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Loader2,
  Copy,
  Check,
  Calendar,
  Layers,
  FileText,
  Percent,
  ExternalLink,
  Sparkles,
} from "lucide-react"

export default function InventoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({})

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt)
    setCopiedText(txt)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const fetchItemDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await inventoryApi.getInventoryItemById(id)
      setItem(res.data)
    } catch (err: any) {
      console.error("Failed to load inventory item details from API:", err)
      setError(err.message || "Failed to load inventory item details from server.")
      setItem(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItemDetail()
  }, [id])

  const handleOpenEdit = () => {
    if (!item) return
    setEditForm({ ...item })
    setCodeError(null)
    setIsEditOpen(true)
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    if (!editForm.code?.trim()) {
      setCodeError("Item code is required.")
      return
    }

    setIsSubmittingEdit(true)
    setCodeError(null)

    try {
      const payload = {
        ...editForm,
        code: editForm.code.trim(),
        name: editForm.name?.trim(),
        quantity: Number(editForm.quantity) || 0,
        reorderLevel: Number(editForm.reorderLevel) || 0,
        purchasePrice: editForm.purchasePrice !== null && editForm.purchasePrice !== undefined
          ? Number(editForm.purchasePrice)
          : null,
        sellingPrice: editForm.sellingPrice !== null && editForm.sellingPrice !== undefined
          ? Number(editForm.sellingPrice)
          : null,
      }

      const res = await inventoryApi.updateInventoryItem(item.id, payload)
      setItem(res.data)
      showNotification(res.message || "Inventory item details updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      if (err.errors?.code || (err.message && err.message.toLowerCase().includes("code"))) {
        setCodeError(err.errors?.code?.[0] || "Code already exists in system.")
      } else {
        setError(err.message || "Failed to update item details.")
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!item) return
    setIsSubmittingDelete(true)

    try {
      await inventoryApi.deleteInventoryItem(item.id)
      router.push("/inventory")
    } catch (err: any) {
      setError(err.message || "Failed to delete item.")
      setIsSubmittingDelete(false)
      setIsDeleteOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Inventory
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Inventory Item Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            The requested SKU ID could not be located.
          </p>
        </Card>
      </div>
    )
  }

  const qty = Number(item.quantity) || 0
  const lvl = Number(item.reorderLevel) || 0
  const isLowStock = qty <= lvl && item.isActive !== false

  const purchasePrice = Number(item.purchasePrice) || 0
  const sellingPrice = Number(item.sellingPrice) || 0
  const totalValuation = qty * purchasePrice
  const profitMargin = sellingPrice - purchasePrice
  const marginPercent = purchasePrice > 0 ? ((profitMargin / purchasePrice) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory" className="gap-1.5 text-xs font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Inventory List
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenEdit} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Edit className="h-4 w-4" /> Edit Details
          </Button>
          <Button onClick={() => setIsDeleteOpen(true)} size="sm" variant="destructive" className="gap-1.5 text-xs">
            <Trash2 className="h-4 w-4" /> Delete SKU
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Profile Card */}
      <Card className="p-6 border border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
              <Boxes className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-foreground">{item.name}</h1>
                <button
                  type="button"
                  onClick={() => handleCopy(item.code)}
                  className="inline-flex items-center gap-1 font-mono text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 rounded border border-border transition-colors font-semibold"
                >
                  <span>{item.code}</span>
                  {copiedText === item.code ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                  {item.type || "RAW"}
                </Badge>
                <span>• Unit: <strong className="text-foreground">{item.unit || "Pcs"}</strong></span>
                {item.hsn && <span>• HSN Code: <strong className="text-foreground font-mono">{item.hsn}</strong></span>}
                {item.warehouse && (
                  <span>• Warehouse: <strong className="text-foreground">{item.warehouse}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isLowStock && (
              <Badge variant="warning" className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4" /> Reorder Alert
              </Badge>
            )}

            {item.needsSetup && (
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4" /> Needs Setup
              </Badge>
            )}

            {item.isActive !== false ? (
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold">
                Active SKU
              </Badge>
            ) : (
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-zinc-500/10 text-zinc-400 border-zinc-500/30 font-bold">
                Inactive SKU
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Stock & Inventory Metrics */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" /> Stock & Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
              <div>
                <span className="text-muted-foreground block text-[11px]">Current Stock</span>
                <span className={`font-mono font-extrabold text-2xl ${isLowStock ? "text-amber-500" : "text-foreground"}`}>
                  {qty.toLocaleString()}
                </span>
                <span className="ml-1 font-medium text-muted-foreground">{item.unit || "Pcs"}</span>
              </div>

              <div className="text-right">
                <span className="text-muted-foreground block text-[11px]">Reorder Threshold</span>
                <span className="font-mono font-bold text-base text-foreground">{lvl}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">Inventory Valuation</span>
                <span className="font-bold text-foreground">₹{totalValuation.toLocaleString()}</span>
              </div>

              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-muted-foreground">Reorder Stock Ratio</span>
                <span className={`font-bold ${isLowStock ? "text-amber-500" : "text-emerald-500"}`}>
                  {lvl > 0 ? `${((qty / lvl) * 100).toFixed(0)}% of min threshold` : "No limit set"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pricing & Profit Margin Analysis */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" /> Financials & Margin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-semibold">Purchase Price</span>
                <span className="font-mono font-extrabold text-base text-foreground">
                  {item.purchasePrice !== null && item.purchasePrice !== undefined
                    ? `₹${purchasePrice.toFixed(2)}`
                    : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Selling Price</span>
                <span className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  {item.sellingPrice !== null && item.sellingPrice !== undefined
                    ? `₹${sellingPrice.toFixed(2)}`
                    : "—"}
                </span>
              </div>
            </div>

            {sellingPrice > 0 && purchasePrice > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Profit Margin per unit</span>
                  <span className={`font-mono font-bold ${profitMargin >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ₹{profitMargin.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-medium">Margin Percentage</span>
                  <span className="font-mono font-extrabold text-foreground">{marginPercent}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Storage & Warehouse Location */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-blue-500" /> Storage & Bin Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Warehouse</span>
                <span className="font-bold text-foreground">{item.warehouse || "—"}</span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Primary Location</span>
                <span className="font-medium text-foreground">{item.location || "—"}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded bg-muted/40 text-center">
                  <span className="text-[9px] text-muted-foreground block font-sans">Store</span>
                  <span className="font-bold text-foreground">{item.store || "—"}</span>
                </div>

                <div className="p-2 rounded bg-muted/40 text-center">
                  <span className="text-[9px] text-muted-foreground block font-sans">Rack</span>
                  <span className="font-bold text-foreground">{item.rack || "—"}</span>
                </div>

                <div className="p-2 rounded bg-muted/40 text-center">
                  <span className="text-[9px] text-muted-foreground block font-sans">Row</span>
                  <span className="font-bold text-foreground">{item.row || "—"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Spec Card */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" /> Material Specifications & Product Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-muted-foreground block text-[11px]">Material Type</span>
              <span className="font-semibold text-foreground text-sm">{item.materialType || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Size / Dimensions</span>
              <span className="font-semibold text-foreground text-sm">{item.size || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Grade Specification</span>
              <span className="font-semibold text-foreground text-sm">{item.grade || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Special Treatment</span>
              <span className="font-semibold text-foreground text-sm">{item.special || "—"}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/40">
            <div>
              <span className="text-muted-foreground block text-[11px]">Linked Product ID (productId)</span>
              {item.productId ? (
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-[11px] font-mono text-foreground font-semibold">
                    {item.productId}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.productId!)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-muted-foreground italic">No external product mapped</span>
              )}
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Remarks & Supplier Notes</span>
              <p className="text-foreground font-medium mt-1">{item.remarks || "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            {item.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created: <strong>{new Date(item.createdAt).toLocaleDateString()}</strong></span>
              </div>
            )}
            {item.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated: <strong>{new Date(item.updatedAt).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Edit Item Detail */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Inventory SKU Specs" maxWidth="lg">
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
                value={editForm.code || ""}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, code: e.target.value }))
                  setCodeError(null)
                }}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Item Name</label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category Type</label>
              <select
                value={editForm.type || "RAW"}
                onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
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
                value={editForm.unit || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">HSN Code</label>
              <Input
                value={editForm.hsn || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, hsn: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Quantity</label>
              <Input
                type="number"
                step="any"
                value={editForm.quantity ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reorder Level</label>
              <Input
                type="number"
                step="any"
                value={editForm.reorderLevel ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, reorderLevel: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Purchase Price (₹)</label>
              <Input
                type="number"
                step="any"
                value={editForm.purchasePrice ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                value={editForm.sellingPrice ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    sellingPrice: e.target.value === "" ? null : parseFloat(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remarks</label>
            <Input
              value={editForm.remarks || ""}
              onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal: Delete Item */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete SKU Confirmation">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete SKU{" "}
            <strong className="text-foreground font-semibold">"{item.code}"</strong> ({item.name})?
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Permanently
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
