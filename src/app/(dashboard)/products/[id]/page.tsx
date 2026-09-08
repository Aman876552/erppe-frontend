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
import { productsApi } from "@/modules/products/lib/products-api"
import { Product } from "@/modules/products/types/product"
import {
  ArrowLeft,
  Package,
  IndianRupee,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  Loader2,
  Copy,
  Check,
  Calendar,
  Layers,
  FileText,
  ExternalLink,
  ShoppingCart,
  Boxes,
  User,
  Wrench,
  Scale,
} from "lucide-react"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Product>>({})

  // Delete Dialog State
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

  const fetchProductDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await productsApi.getProductById(id)
      setProduct(res.data)
    } catch (err: any) {
      console.error("Failed to fetch product detail from API:", err)
      setError(err.message || "Failed to load product details from server.")
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProductDetail()
  }, [id])

  const handleOpenEdit = () => {
    if (!product) return
    setEditForm({ ...product })
    setIsEditOpen(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    if (!editForm.sku?.trim() || !editForm.name?.trim()) return

    setIsSubmittingEdit(true)

    try {
      const payload = {
        ...editForm,
        sku: editForm.sku.trim(),
        name: editForm.name.trim(),
        unitCost: editForm.unitCost !== null && editForm.unitCost !== undefined ? Number(editForm.unitCost) : null,
        sellingCost: editForm.sellingCost !== null && editForm.sellingCost !== undefined ? Number(editForm.sellingCost) : null,
        stockQty: Math.floor(Number(editForm.stockQty) || 0),
        unitsSold: Math.floor(Number(editForm.unitsSold) || 0),
        ordersReceived: Math.floor(Number(editForm.ordersReceived) || 0),
        isOrderable: Boolean(editForm.isOrderable),
      }

      const res = await productsApi.updateProduct(product.id, payload)
      setProduct(res.data)
      showNotification(res.message || "Product master details updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update product details.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return
    setIsSubmittingDelete(true)

    try {
      await productsApi.deleteProduct(product.id)
      router.push("/products")
    } catch (err: any) {
      setError(err.message || "Failed to delete product.")
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

  if (!product) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/products" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Product Catalog
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Product Entry Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            The requested Product ID could not be loaded from the API.
          </p>
        </Card>
      </div>
    )
  }

  const unitCost = Number(product.unitCost) || 0
  const sellingCost = Number(product.sellingCost) || 0
  const margin = sellingCost - unitCost
  const marginPercent = unitCost > 0 ? ((margin / unitCost) * 100).toFixed(1) : "0.0"

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button asChild variant="outline" size="sm">
          <Link href="/products" className="gap-1.5 text-xs font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Product Catalog
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
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Profile Card */}
      <Card className="p-6 border border-border/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold">
              <Package className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-foreground">{product.name}</h1>
                <button
                  type="button"
                  onClick={() => handleCopy(product.sku)}
                  className="inline-flex items-center gap-1 font-mono text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 rounded border border-border transition-colors font-semibold"
                  title="Click to copy SKU"
                >
                  <span>{product.sku}</span>
                  {copiedText === product.sku ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                  {product.itemLevel || "FINISHED"}
                </Badge>
                {product.category && <span>• Category: <strong className="text-foreground">{product.category}</strong></span>}
                {product.productCode && <span>• Code: <strong className="text-foreground">{product.productCode}</strong></span>}
                {product.sapNo && <span>• SAP: <strong className="text-foreground font-mono">{product.sapNo}</strong></span>}
              </div>
            </div>
          </div>

          <div>
            {product.isOrderable !== false ? (
              <Badge variant="outline" className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-extrabold">
                Orderable Item
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-xs bg-zinc-500/10 text-zinc-400 border-zinc-500/30 font-extrabold">
                Hidden / Non-orderable
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Financial Overview */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" /> Financials & Margin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-semibold">Unit Cost</span>
                <span className="font-mono font-extrabold text-base text-foreground">
                  {product.unitCost !== null && product.unitCost !== undefined ? `₹${unitCost.toFixed(2)}` : "—"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Selling Cost</span>
                <span className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  {product.sellingCost !== null && product.sellingCost !== undefined ? `₹${sellingCost.toFixed(2)}` : "—"}
                </span>
              </div>
            </div>

            {sellingCost > 0 && unitCost > 0 && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-1.5 font-mono">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-sans">Profit Margin</span>
                  <span className={`font-bold ${margin >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    ₹{margin.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground font-sans">Margin Percentage</span>
                  <span className="font-extrabold text-foreground">{marginPercent}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Counter Metrics */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Boxes className="h-4 w-4 text-blue-500" /> Stock & Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between">
              <div>
                <span className="text-muted-foreground block text-[10px]">Stock Quantity</span>
                <span className="font-mono font-extrabold text-xl text-foreground">
                  {Number(product.stockQty || 0).toLocaleString()}
                </span>
                <span className="ml-1 text-muted-foreground font-medium">{product.unit || "Pcs"}</span>
              </div>
              <Boxes className="h-6 w-6 text-blue-500/70" />
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] text-muted-foreground block font-sans">Units Sold</span>
                <span className="font-extrabold text-purple-600 dark:text-purple-400">
                  {Number(product.unitsSold || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-muted-foreground block font-sans">Orders Received</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  {Number(product.ordersReceived || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drawing & Technical Document */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Engineering Drawing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Drawing Reference No</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {product.drawingNo || "Not specified"}
              </span>
            </div>

            {product.drawingUrl ? (
              <div className="pt-2">
                <a
                  href={product.drawingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors w-full justify-center"
                >
                  <ExternalLink className="h-4 w-4" /> Open Drawing PDF / File
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/40 text-muted-foreground text-[11px] italic text-center">
                No drawing URL linked to this product.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engineering Specs & Process Card */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-amber-500" /> Engineering Specifications & Material Process
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-muted-foreground block text-[11px]">Product Type</span>
              <span className="font-semibold text-foreground text-sm">{product.productType || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Material Type</span>
              <span className="font-semibold text-foreground text-sm">{product.materialType || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Size / Dimensions</span>
              <span className="font-semibold text-foreground text-sm">{product.size || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Grade</span>
              <span className="font-semibold text-foreground text-sm">{product.grade || "—"}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/40">
            <div>
              <span className="text-muted-foreground block text-[11px]">Special Treatment / Finish</span>
              <span className="font-semibold text-foreground text-sm">{product.special || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Material Processing Steps</span>
              <span className="font-semibold text-foreground text-sm">{product.materialProcess || "—"}</span>
            </div>
          </div>

          {product.clientDescription && (
            <div className="pt-3 border-t border-border/40">
              <span className="text-muted-foreground block text-[11px]">Client Description</span>
              <p className="text-foreground font-medium mt-1">{product.clientDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weights & Dimensions Card */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-500" /> Weight & Unit Packaging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 font-mono">
            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">Weight (kg)</span>
              <span className="font-bold text-foreground text-sm">
                {product.weight !== null && product.weight !== undefined ? product.weight : "—"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">In-Weight (kg)</span>
              <span className="font-bold text-foreground text-sm">
                {product.inWeight !== null && product.inWeight !== undefined ? product.inWeight : "—"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">Single Weight (kg)</span>
              <span className="font-bold text-foreground text-sm">
                {product.singleWeight !== null && product.singleWeight !== undefined ? product.singleWeight : "—"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">Pcs Per Unit</span>
              <span className="font-bold text-foreground text-sm">
                {product.pcsPerUnit !== null && product.pcsPerUnit !== undefined ? product.pcsPerUnit : "1"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px] font-sans">Unit Measure</span>
              <span className="font-bold text-foreground text-sm">{product.unit || "Pcs"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card className="border border-border/60">
        <CardContent className="p-4 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {product.createdBy && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Created by User ID: <strong className="text-foreground font-mono">{product.createdBy}</strong></span>
              </div>
            )}

            {product.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created: <strong>{new Date(product.createdAt).toLocaleDateString()}</strong></span>
              </div>
            )}

            {product.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated: <strong>{new Date(product.updatedAt).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>

          {product.remarks && (
            <div className="text-[11px]">
              Remarks: <strong className="text-foreground">{product.remarks}</strong>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Edit Product */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Product Master Entry" maxWidth="lg">
        <form onSubmit={handleUpdateProduct} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product SKU</label>
              <Input
                value={editForm.sku || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, sku: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Name</label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <Input
                value={editForm.category || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Product Code</label>
              <Input
                value={editForm.productCode || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, productCode: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Item Level</label>
              <select
                value={editForm.itemLevel || "FINISHED"}
                onChange={(e) => setEditForm((prev) => ({ ...prev, itemLevel: e.target.value }))}
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
                value={editForm.unitCost ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                value={editForm.sellingCost ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                value={editForm.stockQty ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                value={editForm.unitsSold ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
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
                value={editForm.ordersReceived ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    ordersReceived: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Drawing URL</label>
            <Input
              value={editForm.drawingUrl || ""}
              onChange={(e) => setEditForm((prev) => ({ ...prev, drawingUrl: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={editForm.isOrderable ?? true}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isOrderable: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <span>Is Orderable</span>
            </label>
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

      {/* Modal: Delete Product */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Product Confirmation">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete product SKU{" "}
            <strong className="text-foreground font-semibold">"{product.sku}"</strong> ({product.name})?
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
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
