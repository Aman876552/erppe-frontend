"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { vendorsApi } from "@/modules/vendors/lib/vendors-api"
import { Vendor, CreateVendorPayload } from "@/modules/vendors/types/vendor"
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  ShoppingBag,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Package,
} from "lucide-react"

export default function VendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const [formData, setFormData] = useState<CreateVendorPayload>({
    name: "",
    vendorCode: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
    panNo: "",
    gstin: "",
    notes: "",
  })

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchVendorDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await vendorsApi.getVendorById(vendorId)
      setVendor(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load vendor profile.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetail()
    }
  }, [vendorId])

  const handleOpenEdit = () => {
    if (!vendor) return
    setFormData({
      name: vendor.name || "",
      vendorCode: vendor.vendorCode || "",
      contact: vendor.contact || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      city: vendor.city || "",
      state: vendor.state || "",
      country: vendor.country || "India",
      pinCode: vendor.pinCode || "",
      panNo: vendor.panNo || "",
      gstin: vendor.gstin || "",
      notes: vendor.notes || "",
    })
    setIsEditOpen(true)
  }

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendor) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await vendorsApi.updateVendor(vendor.id, formData)
      setVendor((prev) => (prev ? { ...prev, ...res.data } : res.data))
      showNotification("Vendor profile updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update vendor.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (!vendor) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      await vendorsApi.deleteVendor(vendor.id)
      router.push("/vendors")
    } catch (err: any) {
      setError(err.message || "Failed to delete vendor.")
      setIsSubmittingDelete(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading vendor details...</span>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vendor Not Found"
          description={`Vendor record ${vendorId} does not exist.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/vendors">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Vendor Directory
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={vendor.name}
        description={`Supplier Profile & Billing Record (Code: ${vendor.vendorCode || vendorId})`}
        badge={
          <Badge variant="info" className="gap-1 font-mono">
            {vendor.vendorCode || `ID: ${vendor.id}`}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/vendors">
                <ArrowLeft className="h-4 w-4" /> Back to Directory
              </Link>
            </Button>
            <Button onClick={handleOpenEdit} variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Edit Vendor
            </Button>
            <Button onClick={() => setIsDeleteOpen(true)} variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      {/* Notification Banner */}
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

      {/* Top Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Spend</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{Number(vendor.totalSpend || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Lifetime disbursement</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Purchase Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{vendor.ordersCount || 0}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Fulfilled orders</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Last Order Date</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-foreground">{vendor.lastOrderOn || "No orders yet"}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Most recent purchase</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Location Hub</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-foreground">{vendor.city || "Not Specified"}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">{vendor.state || "India"}</span>
        </Card>
      </div>

      {/* Main Grid Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Contact & Address Information */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Vendor Contact & Address
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Company Name</span>
              <span className="font-bold text-foreground">{vendor.name}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Contact Person</span>
              <span className="font-semibold text-foreground">{vendor.contact || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" /> Phone
              </span>
              <span className="font-semibold text-foreground">{vendor.phone || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 text-primary" /> Email
              </span>
              <span className="font-semibold text-foreground font-mono">{vendor.email || "—"}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-500" /> Full Address
              </span>
              <div className="text-right font-medium text-foreground max-w-[220px]">
                {vendor.address || "—"}
                {(vendor.city || vendor.state || vendor.pinCode) && (
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {[vendor.city, vendor.state, vendor.country, vendor.pinCode].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tax, Registration & Notes */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" /> Tax Registration & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">GSTIN Number</span>
              <span className="font-bold text-foreground font-mono">{vendor.gstin || "Not Registered"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">PAN Number</span>
              <span className="font-bold text-foreground font-mono">{vendor.panNo || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Package className="h-3 w-3 text-blue-500" /> Last Purchased Item
              </span>
              <span className="font-semibold text-foreground text-right">{vendor.lastOrderItem || "—"}</span>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-medium block">Vendor Notes</span>
              <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                {vendor.notes || "No additional notes recorded for this vendor."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal 1: Edit Vendor */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Vendor Profile" maxWidth="lg">
        <form onSubmit={handleUpdateVendor} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor Code</label>
              <Input
                value={formData.vendorCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Contact Person</label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">City</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">State</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Country</label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Pin Code</label>
              <Input
                value={formData.pinCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, pinCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">GSTIN Number</label>
              <Input
                value={formData.gstin}
                onChange={(e) => setFormData((prev) => ({ ...prev, gstin: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">PAN Number</label>
              <Input
                value={formData.panNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, panNo: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes / Comments</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
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

      {/* Modal 2: Delete Confirmation */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Vendor Profile">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete vendor profile{" "}
            <strong className="text-foreground font-semibold">"{vendor.name}"</strong>? This will permanently erase the
            vendor record.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteVendor} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Vendor
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
