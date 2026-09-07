"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { vendorsApi } from "@/modules/vendors/lib/vendors-api"
import { Vendor, CreateVendorPayload } from "@/modules/vendors/types/vendor"
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ShoppingBag,
} from "lucide-react"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Filters & Search
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("all")

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Form State for Add / Edit
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

  const fetchVendors = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await vendorsApi.getVendors({
        search,
        city: cityFilter !== "all" ? cityFilter : undefined,
      })
      setVendors(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load vendors.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [search, cityFilter])

  // Open Create Dialog
  const handleOpenAdd = () => {
    setFormData({
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
    setIsAddOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v)
    setFormData({
      name: v.name || "",
      vendorCode: v.vendorCode || "",
      contact: v.contact || "",
      phone: v.phone || "",
      email: v.email || "",
      address: v.address || "",
      city: v.city || "",
      state: v.state || "",
      country: v.country || "India",
      pinCode: v.pinCode || "",
      panNo: v.panNo || "",
      gstin: v.gstin || "",
      notes: v.notes || "",
    })
  }

  // Submit Create Vendor: POST /api/vendors
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmittingAdd(true)
    setError(null)

    try {
      const res = await vendorsApi.createVendor({
        ...formData,
        name: formData.name.trim(),
      })

      setVendors((prev) => [res.data, ...prev])
      showNotification(res.message || `Vendor "${formData.name}" created successfully.`)
      setIsAddOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create vendor.")
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Submit Update Vendor: PUT /api/vendors/{id}
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVendor) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await vendorsApi.updateVendor(editingVendor.id, formData)
      setVendors((prev) =>
        prev.map((item) => (String(item.id) === String(editingVendor.id) ? { ...item, ...res.data } : item))
      )
      showNotification(res.message || `Vendor "${editingVendor.name}" updated successfully.`)
      setEditingVendor(null)
    } catch (err: any) {
      setError(err.message || "Failed to update vendor.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Submit Delete Vendor: DELETE /api/vendors/{id}
  const handleDeleteVendor = async () => {
    if (!deletingVendor) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      const res = await vendorsApi.deleteVendor(deletingVendor.id)
      setVendors((prev) => prev.filter((item) => String(item.id) !== String(deletingVendor.id)))
      showNotification(res.message || `Vendor "${deletingVendor.name}" removed successfully.`)
      setDeletingVendor(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete vendor.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Compute Cities list for filter dropdown
  const uniqueCities = Array.from(new Set(vendors.map((v) => v.city).filter(Boolean))) as string[]

  // Filter local dataset if search is performed
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      search === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.vendorCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.city || "").toLowerCase().includes(search.toLowerCase())
    const matchesCity = cityFilter === "all" || v.city === cityFilter
    return matchesSearch && matchesCity
  })

  // Calculate Metrics
  const totalSpendSum = vendors.reduce((sum, v) => sum + (Number(v.totalSpend) || 0), 0)
  const totalOrdersSum = vendors.reduce((sum, v) => sum + (Number(v.ordersCount) || 0), 0)

  // Columns definition for DataTable
  const columns: Column<Vendor>[] = [
    {
      key: "name",
      title: "Vendor Code & Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-xs">{row.name}</span>
              {row.vendorCode && (
                <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4">
                  {row.vendorCode}
                </Badge>
              )}
            </div>
            {row.contact && (
              <span className="text-[11px] text-muted-foreground block">
                Contact: <strong className="text-foreground/80">{row.contact}</strong>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "contact_info",
      title: "Contact Info",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          {row.phone && (
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <Phone className="h-3 w-3 text-primary shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[160px]">{row.email}</span>
            </div>
          )}
          {!row.phone && !row.email && <span className="text-muted-foreground text-[11px]">—</span>}
        </div>
      ),
    },
    {
      key: "location",
      title: "Location",
      render: (row) => (
        <div className="text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{row.city || "—"}</span>
            {row.state && <span className="text-muted-foreground">({row.state})</span>}
          </div>
          {row.address && (
            <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
              {row.address}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "tax",
      title: "GSTIN & PAN",
      render: (row) => (
        <div className="space-y-0.5 text-[11px] font-mono">
          {row.gstin ? (
            <div className="text-foreground">
              <span className="text-muted-foreground text-[10px]">GSTIN: </span>
              <strong>{row.gstin}</strong>
            </div>
          ) : null}
          {row.panNo ? (
            <div className="text-muted-foreground">
              <span className="text-[10px]">PAN: </span>
              <span>{row.panNo}</span>
            </div>
          ) : null}
          {!row.gstin && !row.panNo && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: "spend",
      title: "Orders & Spend",
      sortable: true,
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-foreground">
            ₹{Number(row.totalSpend || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium block">
            {row.ordersCount || 0} Purchase Orders
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Vendor Details">
            <Link href={`/vendors/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit Vendor"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete Vendor"
            onClick={() => setDeletingVendor(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Vendor Directory & Suppliers"
        description="Manage vendor accounts, contact profiles, tax numbers, and purchase metrics."
        badge={<Badge variant="info">{filteredVendors.length} Suppliers Registered</Badge>}
        actions={
          <div className="flex gap-2.5">
            <Button onClick={handleOpenAdd} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Add New Vendor
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

      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Suppliers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{vendors.length}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Registered in system</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Regions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{uniqueCities.length || 1}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Cities & industrial hubs</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Purchases</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalOrdersSum}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Completed purchase orders</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Cumulative Spend</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{totalSpendSum.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Total disbursement</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search vendor name, code, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {uniqueCities.length > 0 && (
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchVendors}
              className="h-9 gap-1.5 text-xs"
              title="Refresh dataset"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Vendors DataTable */}
      <DataTable
        columns={columns}
        data={filteredVendors}
        keyExtractor={(row) => String(row.id)}
        isLoading={isLoading}
      />

      {/* Modal 1: Create New Vendor */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Vendor" maxWidth="lg">
        <form onSubmit={handleCreateVendor} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Acme Supplies Pvt Ltd"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor Code</label>
              <Input
                placeholder="e.g. VEN-001"
                value={formData.vendorCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Contact Person</label>
              <Input
                placeholder="Key account contact name"
                value={formData.contact}
                onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                placeholder="vendor@company.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Address</label>
              <Input
                placeholder="Street address / Industrial area"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">City</label>
              <Input
                placeholder="Mumbai"
                value={formData.city}
                onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">State</label>
              <Input
                placeholder="Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Country</label>
              <Input
                placeholder="India"
                value={formData.country}
                onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Pin Code</label>
              <Input
                placeholder="400001"
                value={formData.pinCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, pinCode: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">GSTIN Number</label>
              <Input
                placeholder="27ABCDE1234F1Z5"
                value={formData.gstin}
                onChange={(e) => setFormData((prev) => ({ ...prev, gstin: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">PAN Number</label>
              <Input
                placeholder="ABCDE1234F"
                value={formData.panNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, panNo: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes / Comments</label>
            <Input
              placeholder="Internal remarks or preferred supplies..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Vendor
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Vendor */}
      <Dialog open={Boolean(editingVendor)} onClose={() => setEditingVendor(null)} title="Edit Vendor Details" maxWidth="lg">
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
            <Button type="button" variant="outline" onClick={() => setEditingVendor(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Vendor Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Vendor */}
      <Dialog open={Boolean(deletingVendor)} onClose={() => setDeletingVendor(null)} title="Delete Vendor Account">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete vendor{" "}
            <strong className="text-foreground font-semibold">"{deletingVendor?.name}"</strong>? This will permanently
            remove their vendor profile and billing history.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingVendor(null)}>
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
