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
import { machinesApi } from "@/modules/machines/lib/machines-api"
import {
  Machine,
  DepartmentOption,
  VendorOption,
  CreateMachinePayload,
  MachineQueryParams,
} from "@/modules/machines/types/machine"
import {
  Wrench,
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
  Calendar,
  Building2,
  Truck,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  User,
  Mail,
  Phone,
  FileText,
} from "lucide-react"

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [vendors, setVendors] = useState<VendorOption[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filters & Search State
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [vendorFilter, setVendorFilter] = useState("all")
  const [purchaseYearFilter, setPurchaseYearFilter] = useState("")

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState<number>(1)
  const [perPage, setPerPage] = useState<number>(10)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Form Field Error Mappings (e.g. for 422 errors)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Form State
  const [formData, setFormData] = useState<CreateMachinePayload>({
    machineName: "",
    brandName: "",
    modelNumber: "",
    serialNumber: "",
    departmentId: 0,
    status: "Active",
    purchaseDate: new Date().toISOString().split("T")[0],
    vendorName: "",
    vendorId: null,
    machinePoNumber: "",
    purchaseAmount: 0,
    warrantyExpiryDate: "",
    engineerName: "",
    engineerEmail: "",
    engineerContact: "",
  })

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt)
    setCopiedId(txt)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Load Lookup Options (Departments & Vendors)
  useEffect(() => {
    const loadLookups = async () => {
      const [deptList, vendList] = await Promise.all([
        machinesApi.getDepartments(),
        machinesApi.getVendors(),
      ])
      setDepartments(deptList)
      setVendors(vendList)
    }
    loadLookups()
  }, [])

  // Fetch Machines from API
  const fetchMachines = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: MachineQueryParams = {
        search: search.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        departmentId: departmentFilter !== "all" ? departmentFilter : undefined,
        vendorId: vendorFilter !== "all" ? vendorFilter : undefined,
        purchaseYear: purchaseYearFilter.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        per_page: perPage,
        page: page,
      }

      const res = await machinesApi.getMachines(params)
      const fetchedList = Array.isArray(res.data) ? res.data : []
      setMachines(fetchedList)

      if (res.meta) {
        setTotalItems(res.meta.total ?? fetchedList.length)
        setTotalPages(res.meta.last_page ?? Math.ceil((res.meta.total ?? fetchedList.length) / perPage) ?? 1)
      } else {
        setTotalItems(fetchedList.length)
        setTotalPages(Math.ceil(fetchedList.length / perPage) || 1)
      }
    } catch (err: any) {
      console.error("Error fetching machines:", err)
      setError(err.message || "Failed to load machinery registry from backend server.")
      setMachines([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [search, statusFilter, departmentFilter, vendorFilter, purchaseYearFilter, sortBy, sortOrder, page, perPage])

  // Handle Vendor Selection -> Auto-fill Vendor Name
  const handleVendorSelect = (selectedVendorId: string) => {
    if (!selectedVendorId) {
      setFormData((prev) => ({ ...prev, vendorId: null }))
      return
    }

    const vId = parseInt(selectedVendorId, 10)
    const matchedVendor = vendors.find((v) => String(v.id) === String(vId))
    setFormData((prev) => ({
      ...prev,
      vendorId: vId,
      vendorName: matchedVendor ? matchedVendor.name : prev.vendorName,
    }))
  }

  // Derive Purchase Year for Form Display
  const derivedPurchaseYear = useMemo(() => {
    if (!formData.purchaseDate) return ""
    return new Date(formData.purchaseDate).getFullYear() || ""
  }, [formData.purchaseDate])

  // Client-side Engineer Email format check
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.machineName.trim()) errors.machineName = "Machine name is required."
    if (!formData.brandName.trim()) errors.brandName = "Brand name is required."
    if (!formData.departmentId || formData.departmentId === 0) errors.departmentId = "Please select a department."
    if (!formData.purchaseDate) errors.purchaseDate = "Purchase date is required."
    if (!formData.vendorName.trim()) errors.vendorName = "Vendor name is required."
    if (formData.purchaseAmount === null || formData.purchaseAmount === undefined || isNaN(formData.purchaseAmount)) {
      errors.purchaseAmount = "Valid purchase amount is required."
    }

    if (formData.engineerEmail && formData.engineerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.engineerEmail.trim())) {
        errors.engineerEmail = "Please enter a valid engineer email address."
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Open Create Modal
  const handleOpenAdd = () => {
    setFieldErrors({})
    setError(null)
    const defaultDept = departments.length > 0 ? Number(departments[0].id) : 0

    setFormData({
      machineName: "",
      brandName: "",
      modelNumber: "",
      serialNumber: "",
      departmentId: defaultDept,
      status: "Active",
      purchaseDate: new Date().toISOString().split("T")[0],
      vendorName: "",
      vendorId: null,
      machinePoNumber: "",
      purchaseAmount: 0,
      warrantyExpiryDate: "",
      engineerName: "",
      engineerEmail: "",
      engineerContact: "",
    })
    setIsAddOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (m: Machine) => {
    setEditingMachine(m)
    setFieldErrors({})
    setError(null)

    setFormData({
      machineName: m.machineName || "",
      brandName: m.brandName || "",
      modelNumber: m.modelNumber || "",
      serialNumber: m.serialNumber || "",
      departmentId: Number(m.departmentId) || (m.department?.id ? Number(m.department.id) : 0),
      status: m.status || "Active",
      purchaseDate: m.purchaseDate ? m.purchaseDate.split("T")[0] : "",
      vendorName: m.vendorName || m.vendor?.name || "",
      vendorId: m.vendorId || (m.vendor?.id ? Number(m.vendor.id) : null),
      machinePoNumber: m.machinePoNumber || "",
      purchaseAmount: Number(m.purchaseAmount) || 0,
      warrantyExpiryDate: m.warrantyExpiryDate ? m.warrantyExpiryDate.split("T")[0] : "",
      engineerName: m.engineerName || "",
      engineerEmail: m.engineerEmail || "",
      engineerContact: m.engineerContact || "",
    })
  }

  // Submit Create Machine: POST /api/machines
  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmittingAdd(true)
    setError(null)

    try {
      const payload: CreateMachinePayload = {
        machineName: formData.machineName.trim(),
        brandName: formData.brandName.trim(),
        modelNumber: formData.modelNumber?.trim() || null,
        serialNumber: formData.serialNumber?.trim() || null,
        departmentId: Number(formData.departmentId),
        status: formData.status || "Active",
        purchaseDate: formData.purchaseDate,
        vendorName: formData.vendorName.trim(),
        vendorId: formData.vendorId ? Number(formData.vendorId) : null,
        machinePoNumber: formData.machinePoNumber?.trim() || null,
        purchaseAmount: Number(formData.purchaseAmount) || 0,
        warrantyExpiryDate: formData.warrantyExpiryDate || null,
        engineerName: formData.engineerName?.trim() || null,
        engineerEmail: formData.engineerEmail?.trim() || null,
        engineerContact: formData.engineerContact?.trim() || null,
      }

      const res = await machinesApi.createMachine(payload)
      setMachines((prev) => [res.data, ...prev])
      showNotification(res.message || `Machine "${formData.machineName}" registered successfully.`)
      setIsAddOpen(false)
    } catch (err: any) {
      if (err.errors) {
        const mappedErrors: Record<string, string> = {}
        Object.keys(err.errors).forEach((key) => {
          mappedErrors[key] = err.errors[key][0]
        })
        setFieldErrors(mappedErrors)
      } else {
        setError(err.message || "Failed to create machine record.")
      }
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Submit Update Machine: PUT /api/machines/{id}
  const handleUpdateMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMachine) return
    if (!validateForm()) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const payload = {
        machineName: formData.machineName.trim(),
        brandName: formData.brandName.trim(),
        modelNumber: formData.modelNumber?.trim() || null,
        serialNumber: formData.serialNumber?.trim() || null,
        departmentId: Number(formData.departmentId),
        status: formData.status || "Active",
        purchaseDate: formData.purchaseDate,
        vendorName: formData.vendorName.trim(),
        vendorId: formData.vendorId ? Number(formData.vendorId) : null,
        machinePoNumber: formData.machinePoNumber?.trim() || null,
        purchaseAmount: Number(formData.purchaseAmount) || 0,
        warrantyExpiryDate: formData.warrantyExpiryDate || null,
        engineerName: formData.engineerName?.trim() || null,
        engineerEmail: formData.engineerEmail?.trim() || null,
        engineerContact: formData.engineerContact?.trim() || null,
      }

      const res = await machinesApi.updateMachine(editingMachine.id, payload)
      setMachines((prev) =>
        prev.map((m) => (String(m.id) === String(editingMachine.id) ? { ...m, ...res.data } : m))
      )
      showNotification(res.message || `Machine "${editingMachine.machineName}" updated successfully.`)
      setEditingMachine(null)
    } catch (err: any) {
      if (err.errors) {
        const mappedErrors: Record<string, string> = {}
        Object.keys(err.errors).forEach((key) => {
          mappedErrors[key] = err.errors[key][0]
        })
        setFieldErrors(mappedErrors)
      } else {
        setError(err.message || "Failed to update machine record.")
      }
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Submit Delete Machine: DELETE /api/machines/{id}
  const handleDeleteMachine = async () => {
    if (!deletingMachine) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      const res = await machinesApi.deleteMachine(deletingMachine.id)
      setMachines((prev) => prev.filter((m) => String(m.id) !== String(deletingMachine.id)))
      showNotification(res.message || `Machine "${deletingMachine.machineName}" deleted successfully.`)
      setDeletingMachine(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete machine record.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Calculation Metrics
  const activeCount = machines.filter((m) => (m.status || "").toLowerCase() === "active").length
  const warrantyAlertsCount = machines.filter((m) => {
    const w = machinesApi.getWarrantyStatus(m.warrantyExpiryDate)
    return w.status === "EXPIRED" || w.status === "EXPIRING_SOON"
  }).length
  const totalInvestmentSum = machines.reduce((sum, m) => sum + (Number(m.purchaseAmount) || 0), 0)

  // Columns definition for DataTable
  const columns: Column<Machine>[] = [
    {
      key: "machineId",
      title: "Machine ID & Name",
      sortable: true,
      render: (row) => {
        const displayId = row.machineId || `MAC-${String(row.id).padStart(5, "0")}`
        return (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
              <Wrench className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground text-xs">{row.machineName}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(displayId)}
                  className="inline-flex items-center gap-1 font-mono text-[10px] bg-muted/60 hover:bg-muted text-foreground px-1.5 py-0.5 rounded border border-border transition-colors font-semibold"
                  title="Click to copy Machine ID"
                >
                  <span>{displayId}</span>
                  {copiedId === displayId ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">{row.brandName}</span>
                {row.modelNumber && <span>• Model: {row.modelNumber}</span>}
                {row.serialNumber && <span>• S/N: {row.serialNumber}</span>}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: "department",
      title: "Department",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>{row.department?.name || `Dept #${row.departmentId}`}</span>
        </div>
      ),
    },
    {
      key: "vendor",
      title: "Vendor / Supplier",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Truck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{row.vendorName || row.vendor?.name || "—"}</span>
          </div>
          {row.machinePoNumber && (
            <span className="text-[10px] font-mono text-muted-foreground block">
              PO: {row.machinePoNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "purchaseAmount",
      title: "Purchase Date & Amount",
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5 text-xs font-mono">
          <div className="text-foreground font-bold">
            ₹{Number(row.purchaseAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted-foreground font-sans flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : "—"}</span>
            {row.purchaseYear && <span className="font-mono">({row.purchaseYear})</span>}
          </div>
        </div>
      ),
    },
    {
      key: "warranty",
      title: "Warranty Status",
      render: (row) => {
        const w = machinesApi.getWarrantyStatus(row.warrantyExpiryDate)
        if (w.status === "EXPIRED") {
          return (
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 font-bold gap-1">
              <ShieldAlert className="h-3 w-3" /> Expired
            </Badge>
          )
        } else if (w.status === "EXPIRING_SOON") {
          return (
            <Badge variant="warning" className="text-[10px] px-2 py-0.5 font-bold gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
              <AlertTriangle className="h-3 w-3" /> Expiring Soon
            </Badge>
          )
        } else if (w.status === "ACTIVE") {
          return (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              <ShieldCheck className="h-3 w-3" /> Active Warranty
            </Badge>
          )
        }
        return <span className="text-muted-foreground text-xs">—</span>
      },
    },
    {
      key: "status",
      title: "Status",
      sortable: true,
      render: (row) => (
        <div>
          {(row.status || "").toLowerCase() === "active" ? (
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
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Machine Spec Sheet">
            <Link href={`/machines/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit Machine Details"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete Machine"
            onClick={() => setDeletingMachine(row)}
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
        title="Machine Registry & Plant Equipment"
        description="Track industrial machinery, department assignments, vendor profiles, warranty expirations, and service engineers."
        badge={<Badge variant="info">{totalItems} Machinery Total</Badge>}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleOpenAdd} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Register New Machine
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
            <span className="text-xs font-semibold text-muted-foreground">Total Machinery</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalItems}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Registered plant assets</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Machinery</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{activeCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Operational equipment</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Warranty Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-500">{warrantyAlertsCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Expired or expiring ≤30 days</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Capital Spent</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{totalInvestmentSum.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Purchase investment</span>
        </Card>
      </div>

      {/* Toolbar & Filters */}
      <Card className="p-4 border border-border/60 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search machine ID, name, brand, model, serial, vendor, PO..."
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
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            {/* Vendor Filter */}
            {vendors.length > 0 && (
              <select
                value={vendorFilter}
                onChange={(e) => {
                  setVendorFilter(e.target.value)
                  setPage(1)
                }}
                className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchMachines}
              className="h-9 gap-1.5 text-xs"
              title="Refresh machinery list"
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
              <option value="createdAt">Date Added</option>
              <option value="machineName">Machine Name</option>
              <option value="brandName">Brand Name</option>
              <option value="purchaseDate">Purchase Date</option>
              <option value="purchaseAmount">Purchase Amount</option>
              <option value="status">Status</option>
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
        data={machines}
        keyExtractor={(row) => String(row.id)}
        isLoading={isLoading}
      />

      {/* Server Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs">
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalItems} machines total)
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

      {/* Modal 1: Create Machine */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register New Plant Machine" maxWidth="lg">
        <form onSubmit={handleCreateMachine} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Machine Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. CNC Laser Cutter"
                value={formData.machineName}
                onChange={(e) => setFormData((prev) => ({ ...prev, machineName: e.target.value }))}
                required
                autoFocus
                className={fieldErrors.machineName ? "border-red-500" : ""}
              />
              {fieldErrors.machineName && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.machineName}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Trumpf"
                value={formData.brandName}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandName: e.target.value }))}
                required
                className={fieldErrors.brandName ? "border-red-500" : ""}
              />
              {fieldErrors.brandName && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.brandName}</span>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Model Number</label>
              <Input
                placeholder="TruLaser 3030"
                value={formData.modelNumber || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, modelNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Serial Number</label>
              <Input
                placeholder="TL3030-88213"
                value={formData.serialNumber || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, departmentId: parseInt(e.target.value, 10) }))}
                className={`w-full h-9 rounded-lg border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.departmentId ? "border-red-500" : "border-input"
                }`}
                required
              >
                <option value={0}>Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {fieldErrors.departmentId && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.departmentId}</span>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor / Supplier Pick</label>
              <select
                value={formData.vendorId || ""}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Off-list / Select Vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.vendorCode ? `(${v.vendorCode})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Precision Machines Pvt Ltd"
                value={formData.vendorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorName: e.target.value }))}
                required
                className={fieldErrors.vendorName ? "border-red-500" : ""}
              />
              {fieldErrors.vendorName && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.vendorName}</span>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                {derivedPurchaseYear && (
                  <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                    Year: {derivedPurchaseYear} (Auto)
                  </span>
                )}
              </div>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                required
                className={fieldErrors.purchaseDate ? "border-red-500" : ""}
              />
              {fieldErrors.purchaseDate && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.purchaseDate}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Purchase Amount (₹) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="any"
                placeholder="1250000.00"
                value={formData.purchaseAmount || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchaseAmount: parseFloat(e.target.value) || 0 }))}
                required
                className={fieldErrors.purchaseAmount ? "border-red-500" : ""}
              />
              {fieldErrors.purchaseAmount && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.purchaseAmount}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">PO Ref Number</label>
              <Input
                placeholder="PO-MAC-2024-0091"
                value={formData.machinePoNumber || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, machinePoNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Warranty Expiry Date</label>
              <Input
                type="date"
                value={formData.warrantyExpiryDate || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, warrantyExpiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Operational Status</label>
              <select
                value={formData.status || "Active"}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Service Engineer Name</label>
              <Input
                placeholder="S. Iyer"
                value={formData.engineerName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, engineerName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Engineer Email</label>
              <Input
                type="email"
                placeholder="s.iyer@precision.example"
                value={formData.engineerEmail || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, engineerEmail: e.target.value }))}
                className={fieldErrors.engineerEmail ? "border-red-500" : ""}
              />
              {fieldErrors.engineerEmail && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.engineerEmail}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Engineer Phone / Contact</label>
              <Input
                placeholder="9876543210"
                value={formData.engineerContact || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, engineerContact: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Register Machine
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Machine */}
      <Dialog open={Boolean(editingMachine)} onClose={() => setEditingMachine(null)} title="Edit Machine Profile" maxWidth="lg">
        <form onSubmit={handleUpdateMachine} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Machine Name</label>
              <Input
                value={formData.machineName}
                onChange={(e) => setFormData((prev) => ({ ...prev, machineName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Brand Name</label>
              <Input
                value={formData.brandName}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Model Number</label>
              <Input
                value={formData.modelNumber || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, modelNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Serial Number</label>
              <Input
                value={formData.serialNumber || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, departmentId: parseInt(e.target.value, 10) }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground"
                required
              >
                <option value={0}>Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor Pick</label>
              <select
                value={formData.vendorId || ""}
                onChange={(e) => handleVendorSelect(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground"
              >
                <option value="">Off-list / Select Vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Vendor Name</label>
              <Input
                value={formData.vendorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, vendorName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Purchase Date</label>
              <Input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Purchase Amount (₹)</label>
              <Input
                type="number"
                step="any"
                value={formData.purchaseAmount || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, purchaseAmount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">PO Ref Number</label>
              <Input
                value={formData.machinePoNumber || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, machinePoNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Warranty Expiry Date</label>
              <Input
                type="date"
                value={formData.warrantyExpiryDate || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, warrantyExpiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                value={formData.status || "Active"}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Service Engineer Name</label>
              <Input
                value={formData.engineerName || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, engineerName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Engineer Email</label>
              <Input
                type="email"
                value={formData.engineerEmail || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, engineerEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Engineer Phone</label>
              <Input
                value={formData.engineerContact || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, engineerContact: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingMachine(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Machine */}
      <Dialog open={Boolean(deletingMachine)} onClose={() => setDeletingMachine(null)} title="Delete Machine Entry">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove machine{" "}
            <strong className="text-foreground font-semibold">"{deletingMachine?.machineName}"</strong> (
            {deletingMachine?.brandName}) from the registry?
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingMachine(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMachine} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Machine
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
