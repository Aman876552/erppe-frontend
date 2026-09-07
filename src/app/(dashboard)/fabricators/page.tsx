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
import { fabricatorsApi } from "@/modules/fabricators/lib/fabricators-api"
import { Fabricator, CreateFabricatorPayload, FabricatorStatus } from "@/modules/fabricators/types/fabricator"
import {
  Factory,
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
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  Wrench,
  Check,
  XCircle,
} from "lucide-react"

const COMMON_FABRICATION_TYPES = [
  "Steel Fabrication",
  "Sheet Metal Fabrication",
  "Aluminum Fabrication",
  "Piping & Tubing",
  "Structural Fabrication",
  "Heavy Machining",
  "Stainless Steel Works",
]

export default function FabricatorsPage() {
  const [fabricators, setFabricators] = useState<Fabricator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Filters & Search
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  const [editingFabricator, setEditingFabricator] = useState<Fabricator | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingFabricator, setDeletingFabricator] = useState<Fabricator | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Form State for Add / Edit
  const [formData, setFormData] = useState<CreateFabricatorPayload>({
    fabricatorName: "",
    contactPerson: "",
    mobileNumber: "",
    fabricationType: "Steel Fabrication",
    email: "",
    address: "",
    city: "",
    gstNumber: "",
    status: "Active",
    remarks: "",
  })

  // Email format validation error state
  const [emailError, setEmailError] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchFabricators = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fabricatorsApi.getFabricators({
        search,
        status: statusFilter !== "all" ? statusFilter : undefined,
        fabricationType: typeFilter !== "all" ? typeFilter : undefined,
      })
      setFabricators(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load fabricator directory.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFabricators()
  }, [search, statusFilter, typeFilter])

  const validateEmail = (emailStr: string): boolean => {
    if (!emailStr.trim()) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailStr.trim())
  }

  // Open Create Dialog
  const handleOpenAdd = () => {
    setEmailError(null)
    setFormData({
      fabricatorName: "",
      contactPerson: "",
      mobileNumber: "",
      fabricationType: "Steel Fabrication",
      email: "",
      address: "",
      city: "",
      gstNumber: "",
      status: "Active",
      remarks: "",
    })
    setIsAddOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (f: Fabricator) => {
    setEmailError(null)
    setEditingFabricator(f)
    setFormData({
      fabricatorName: f.fabricatorName || "",
      contactPerson: f.contactPerson || "",
      mobileNumber: f.mobileNumber || "",
      fabricationType: f.fabricationType || "Steel Fabrication",
      email: f.email || "",
      address: f.address || "",
      city: f.city || "",
      gstNumber: f.gstNumber || "",
      status: f.status || "Active",
      remarks: f.remarks || "",
    })
  }

  // Submit Create Fabricator: POST /api/fabricators
  const handleCreateFabricator = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate 4 required fields
    if (!formData.fabricatorName.trim() || !formData.contactPerson.trim() || !formData.mobileNumber.trim() || !formData.fabricationType.trim()) {
      setError("Please fill in all 4 required fields (Name, Contact Person, Mobile, Fabrication Type).")
      return
    }

    // Validate email format if provided
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address format (e.g. name@domain.com).")
      return
    }
    setEmailError(null)

    setIsSubmittingAdd(true)
    setError(null)

    try {
      const res = await fabricatorsApi.createFabricator({
        ...formData,
        fabricatorName: formData.fabricatorName.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        fabricationType: formData.fabricationType.trim(),
      })

      setFabricators((prev) => [res.data, ...prev])
      showNotification(res.message || `Fabricator "${formData.fabricatorName}" created successfully.`)
      setIsAddOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create fabricator.")
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Submit Update Fabricator: PUT /api/fabricators/{id}
  const handleUpdateFabricator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFabricator) return

    if (formData.email && !validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address format.")
      return
    }
    setEmailError(null)

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await fabricatorsApi.updateFabricator(editingFabricator.id, formData)
      setFabricators((prev) =>
        prev.map((item) => (String(item.id) === String(editingFabricator.id) ? { ...item, ...res.data } : item))
      )
      showNotification(res.message || `Fabricator "${editingFabricator.fabricatorName}" updated successfully.`)
      setEditingFabricator(null)
    } catch (err: any) {
      setError(err.message || "Failed to update fabricator.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Submit Delete Fabricator: DELETE /api/fabricators/{id}
  const handleDeleteFabricator = async () => {
    if (!deletingFabricator) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      const res = await fabricatorsApi.deleteFabricator(deletingFabricator.id)
      setFabricators((prev) => prev.filter((item) => String(item.id) !== String(deletingFabricator.id)))
      showNotification(res.message || `Fabricator "${deletingFabricator.fabricatorName}" deleted successfully.`)
      setDeletingFabricator(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete fabricator.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Compute unique types for filter
  const uniqueTypes = Array.from(new Set(fabricators.map((f) => f.fabricationType).filter(Boolean)))

  // Local search filter
  const filteredFabricators = fabricators.filter((f) => {
    const matchesSearch =
      search === "" ||
      f.fabricatorName.toLowerCase().includes(search.toLowerCase()) ||
      f.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      f.mobileNumber.toLowerCase().includes(search.toLowerCase()) ||
      (f.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.fabricationType || "").toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === "all" || f.status === statusFilter
    const matchesType = typeFilter === "all" || f.fabricationType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Metrics
  const activeCount = fabricators.filter((f) => f.status === "Active" || !f.status).length
  const inactiveCount = fabricators.filter((f) => f.status === "Inactive").length

  // Columns definition for DataTable (Plain Array, non-paginated)
  const columns: Column<Fabricator>[] = [
    {
      key: "fabricatorName",
      title: "Fabricator Name & Type",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 font-bold text-xs">
            <Factory className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-foreground text-xs block">{row.fabricatorName}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 mt-0.5 border-purple-500/30 text-purple-600 font-medium">
              <Wrench className="h-2.5 w-2.5 mr-1" />
              {row.fabricationType || "General Fabrication"}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      title: "Contact Person & Mobile",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <UserCheck className="h-3 w-3 text-primary shrink-0" />
            <span>{row.contactPerson}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{row.mobileNumber}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email_city",
      title: "Email & Location",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          {row.email && (
            <div className="flex items-center gap-1.5 text-foreground">
              <Mail className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate max-w-[170px] font-mono text-[11px]">{row.email}</span>
            </div>
          )}
          {row.city && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
              <span>{row.city}</span>
            </div>
          )}
          {!row.email && !row.city && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: "gstNumber",
      title: "GST Number",
      render: (row) => (
        <span className="font-mono text-[11px] font-semibold text-foreground">
          {row.gstNumber || "—"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => {
        const isActive = row.status === "Active" || !row.status
        return isActive ? (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 gap-1 text-[10px]">
            <Check className="h-3 w-3" /> Active
          </Badge>
        ) : (
          <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-400 gap-1 text-[10px]">
            <XCircle className="h-3 w-3" /> Inactive
          </Badge>
        )
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Fabricator Detail">
            <Link href={`/fabricators/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit Fabricator"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete Fabricator"
            onClick={() => setDeletingFabricator(row)}
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
        title="Fabricator Directory & Partners"
        description="Manage fabrication partners, contact persons, job types, and workshop profiles."
        badge={<Badge variant="info">{filteredFabricators.length} Fabricators Registered</Badge>}
        actions={
          <div className="flex gap-2.5">
            <Button onClick={handleOpenAdd} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Add New Fabricator
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
            <span className="text-xs font-semibold text-muted-foreground">Total Fabricators</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Factory className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{fabricators.length}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Registered workshops</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Fabricators</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Check className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{activeCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Operational Status</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Inactive / Paused</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-500">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{inactiveCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Archived or paused contracts</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Fabrication Specialties</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{uniqueTypes.length || 1}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Distinct Job Categories</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search fabricator, contact, mobile, city, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {uniqueTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Fabrication Types</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchFabricators}
              className="h-9 gap-1.5 text-xs"
              title="Refresh dataset"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Fabricators DataTable (Plain non-paginated array dataset) */}
      <DataTable
        columns={columns}
        data={filteredFabricators}
        keyExtractor={(row) => String(row.id)}
        isLoading={isLoading}
      />

      {/* Modal 1: Create New Fabricator */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Fabricator" maxWidth="lg">
        <form onSubmit={handleCreateFabricator} className="space-y-4 mt-2">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-medium flex items-center justify-between">
            <span>Required fields: Name, Contact Person, Mobile Number, Fabrication Type</span>
            <span className="font-bold text-red-500">* Required</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Fabricator Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Sunrise Fabricators"
                value={formData.fabricatorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fabricatorName: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Fabrication Type <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Steel Fabrication"
                value={formData.fabricationType}
                onChange={(e) => setFormData((prev) => ({ ...prev, fabricationType: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Ramesh Patel"
                value={formData.contactPerson}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. 9876543210"
                value={formData.mobileNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address (Optional)</label>
              <Input
                type="email"
                placeholder="ramesh@sunrisefab.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                  setEmailError(null)
                }}
              />
              {emailError && <p className="text-[10px] font-semibold text-red-500">{emailError}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                value={formData.status || "Active"}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as FabricatorStatus }))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Address</label>
              <Input
                placeholder="Plot / Industrial Area"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">City</label>
                <Input
                  placeholder="Ahmedabad"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">GST Number</label>
                <Input
                  placeholder="24ABCDE1234F1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gstNumber: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remarks / Specialization Notes</label>
            <Input
              placeholder="e.g. Handles heavy structural steel work and pipe fittings..."
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Fabricator
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Fabricator */}
      <Dialog open={Boolean(editingFabricator)} onClose={() => setEditingFabricator(null)} title="Edit Fabricator Details" maxWidth="lg">
        <form onSubmit={handleUpdateFabricator} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Fabricator Name</label>
              <Input
                value={formData.fabricatorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fabricatorName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Fabrication Type</label>
              <Input
                value={formData.fabricationType}
                onChange={(e) => setFormData((prev) => ({ ...prev, fabricationType: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Contact Person</label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mobile Number</label>
              <Input
                value={formData.mobileNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                  setEmailError(null)
                }}
              />
              {emailError && <p className="text-[10px] font-semibold text-red-500">{emailError}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                value={formData.status || "Active"}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as FabricatorStatus }))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">GST Number</label>
                <Input
                  value={formData.gstNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gstNumber: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remarks</label>
            <Input
              value={formData.remarks}
              onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingFabricator(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Fabricator Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Confirmation */}
      <Dialog open={Boolean(deletingFabricator)} onClose={() => setDeletingFabricator(null)} title="Delete Fabricator Profile">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete fabricator partner{" "}
            <strong className="text-foreground font-semibold">"{deletingFabricator?.fabricatorName}"</strong>? This will permanently
            remove their workshop record.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingFabricator(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFabricator} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Fabricator
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
