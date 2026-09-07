"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { clientsApi } from "@/modules/clients/lib/clients-api"
import {
  Client,
  ClientLocation,
  CreateClientPayload,
  ClientDocumentFiles,
} from "@/modules/clients/types/client"
import {
  UserCheck,
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
  Paperclip,
  Upload,
  Check,
} from "lucide-react"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Search & Filter
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false)

  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Active Form Tab inside modal
  const [activeTab, setActiveTab] = useState<"account" | "locations" | "documents">("account")

  // Form State
  const [formData, setFormData] = useState<CreateClientPayload>({
    clientCode: "",
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    status: "Active",
    notes: "",
    locations: [],
  })

  // File Uploads State (8 Spatie document fields)
  const [documentFiles, setDocumentFiles] = useState<ClientDocumentFiles>({
    panCard: null,
    gstCertificate: null,
    cinIncorporation: null,
    msmeUdyam: null,
    iecCertificate: null,
    cancelledCheque: null,
    agreementContract: null,
    otherCompliance: null,
  })

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchClients = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await clientsApi.getClients({
        search,
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
      setClients(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load clients.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [search, statusFilter])

  // Reset Form for Create
  const handleOpenAdd = () => {
    setActiveTab("account")
    setFormData({
      clientCode: `CL-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      contact: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      status: "Active",
      notes: "",
      locations: [
        {
          locationName: "Head Office",
          contactPerson: "",
          deliveryAddress: "",
        },
      ],
    })
    setDocumentFiles({
      panCard: null,
      gstCertificate: null,
      cinIncorporation: null,
      msmeUdyam: null,
      iecCertificate: null,
      cancelledCheque: null,
      agreementContract: null,
      otherCompliance: null,
    })
    setIsAddOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (c: Client) => {
    setActiveTab("account")
    setEditingClient(c)
    setFormData({
      clientCode: c.clientCode || "",
      name: c.name || "",
      contact: c.contact || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      pincode: c.pincode || "",
      status: c.status || "Active",
      notes: c.notes || "",
      locations: c.locations ? [...c.locations] : [],
      panCard: c.panCard,
      gstCertificate: c.gstCertificate,
      cinIncorporation: c.cinIncorporation,
      msmeUdyam: c.msmeUdyam,
      iecCertificate: c.iecCertificate,
      cancelledCheque: c.cancelledCheque,
      agreementContract: c.agreementContract,
      otherCompliance: c.otherCompliance,
    })
    setDocumentFiles({
      panCard: null,
      gstCertificate: null,
      cinIncorporation: null,
      msmeUdyam: null,
      iecCertificate: null,
      cancelledCheque: null,
      agreementContract: null,
      otherCompliance: null,
    })
  }

  // Add a new blank location row to repeatable list
  const handleAddLocationRow = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [
        ...(prev.locations || []),
        {
          locationName: "",
          contactPerson: "",
          deliveryAddress: "",
          dispatchInstruction: "",
          transportTerms: "",
          taxShippingInfo: "",
        },
      ],
    }))
  }

  // Remove a location row (calls standalone API if existing with ID)
  const handleRemoveLocationRow = async (index: number) => {
    const locToRemove = formData.locations?.[index]
    if (locToRemove && locToRemove.id) {
      try {
        await clientsApi.deleteClientLocation(locToRemove.id)
        showNotification(`Location "${locToRemove.locationName}" deleted from server.`)
      } catch (err) {
        console.warn("Location delete error:", err)
      }
    }

    setFormData((prev) => ({
      ...prev,
      locations: prev.locations?.filter((_, idx) => idx !== index),
    }))
  }

  // Update a field inside a specific location row
  const handleLocationChange = (index: number, field: keyof ClientLocation, value: string) => {
    setFormData((prev) => {
      const updatedLocs = [...(prev.locations || [])]
      updatedLocs[index] = {
        ...updatedLocs[index],
        [field]: value,
      }
      return { ...prev, locations: updatedLocs }
    })
  }

  // Handle File Input Selection
  const handleFileChange = (docKey: keyof ClientDocumentFiles, file: File | null) => {
    setDocumentFiles((prev) => ({
      ...prev,
      [docKey]: file,
    }))
  }

  // Create Client: POST /api/clients
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientCode.trim() || !formData.name.trim()) {
      setError("Please fill in required fields: Client Code and Name.")
      return
    }

    setIsSubmittingAdd(true)
    setError(null)

    try {
      const res = await clientsApi.createClient(formData, documentFiles)
      setClients((prev) => [res.data, ...prev])
      showNotification(res.message || `Client "${formData.name}" created successfully.`)
      setIsAddOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to create client.")
    } finally {
      setIsSubmittingAdd(false)
    }
  }

  // Update Client: PUT /api/clients/{id} (or multipart POST with _method=PUT)
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await clientsApi.updateClient(editingClient.id, formData, documentFiles)
      setClients((prev) =>
        prev.map((item) => (String(item.id) === String(editingClient.id) ? { ...item, ...res.data } : item))
      )
      showNotification(res.message || `Client "${editingClient.name}" updated successfully.`)
      setEditingClient(null)
    } catch (err: any) {
      setError(err.message || "Failed to update client.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  // Delete Client: DELETE /api/clients/{id}
  const handleDeleteClient = async () => {
    if (!deletingClient) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      const res = await clientsApi.deleteClient(deletingClient.id)
      setClients((prev) => prev.filter((item) => String(item.id) !== String(deletingClient.id)))
      showNotification(res.message || `Client "${deletingClient.name}" deleted.`)
      setDeletingClient(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete client.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Filter local dataset
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.city || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Metrics
  const totalPending = clients.reduce((sum, c) => sum + (Number(c.pendingPayment) || 0), 0)
  const totalOrders = clients.reduce((sum, c) => sum + (Number(c.ordersCount) || 0), 0)
  const totalLocationsCount = clients.reduce((sum, c) => sum + (c.locations?.length || 0), 0)

  // DataTable Columns
  const columns: Column<Client>[] = [
    {
      key: "clientCode",
      title: "Client Code & Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold text-xs">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-xs">{row.name}</span>
              <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4">
                {row.clientCode}
              </Badge>
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
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Phone className="h-3 w-3 text-primary shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[160px]">{row.email}</span>
            </div>
          )}
          {!row.phone && !row.email && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: "locations",
      title: "Delivery Locations",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <Badge variant="secondary" className="text-[10px] font-semibold gap-1">
            <MapPin className="h-3 w-3 text-emerald-500" />
            {row.locations?.length || 0} Location{(row.locations?.length || 0) !== 1 ? "s" : ""}
          </Badge>
          {row.city && (
            <span className="text-[11px] text-muted-foreground block">
              Hub: <strong className="text-foreground">{row.city}</strong>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "financials",
      title: "Orders & Pending",
      sortable: true,
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-foreground">
            {row.ordersCount || 0} Orders
          </div>
          {Number(row.pendingPayment || 0) > 0 ? (
            <span className="text-[10px] font-bold text-red-500 block">
              Pending: ₹{Number(row.pendingPayment).toLocaleString("en-IN")}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-500 font-semibold block">Fully Settled</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <Badge variant="outline" className="font-semibold text-[10px]">
          {row.status || "Active"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8" title="View Profile & Locations">
            <Link href={`/clients/${row.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit Client"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500 hover:bg-red-500/10"
            title="Delete Client"
            onClick={() => setDeletingClient(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const DOCUMENT_LABELS = [
    { key: "panCard" as const, label: "PAN Card Document" },
    { key: "gstCertificate" as const, label: "GST Registration Certificate" },
    { key: "cinIncorporation" as const, label: "CIN / Incorporation Cert" },
    { key: "msmeUdyam" as const, label: "MSME Udyam Registration" },
    { key: "iecCertificate" as const, label: "IEC Import Export Cert" },
    { key: "cancelledCheque" as const, label: "Cancelled Cheque / Bank Info" },
    { key: "agreementContract" as const, label: "Client Agreement / Contract" },
    { key: "otherCompliance" as const, label: "Other Compliance Document" },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Client Accounts & Enterprise Directory"
        description="Manage client directory, multi-warehouse delivery locations, and Spatie compliance documents."
        badge={<Badge variant="info">{filteredClients.length} Enterprise Clients</Badge>}
        actions={
          <div className="flex gap-2.5">
            <Button onClick={handleOpenAdd} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Add New Client
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

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Client Accounts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{clients.length}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Active accounts</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Delivery Locations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalLocationsCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Warehouses & site hubs</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalOrders}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Fulfilled orders</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending Receivables</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground text-red-500">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Outstanding invoices</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search client name, code, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchClients}
              className="h-9 gap-1.5 text-xs"
              title="Refresh dataset"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Clients DataTable (Plain non-paginated dataset) */}
      <DataTable
        columns={columns}
        data={filteredClients}
        keyExtractor={(row) => String(row.id)}
        isLoading={isLoading}
      />

      {/* Modal 1: Create New Client (Tabbed Form with Locations & Spatie Documents) */}
      <Dialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Enterprise Client"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateClient} className="space-y-4 mt-2">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Button
              type="button"
              variant={activeTab === "account" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("account")}
              className="text-xs"
            >
              1. Account Info & Address
            </Button>
            <Button
              type="button"
              variant={activeTab === "locations" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("locations")}
              className="text-xs gap-1.5"
            >
              2. Delivery Locations
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                {formData.locations?.length || 0}
              </Badge>
            </Button>
            <Button
              type="button"
              variant={activeTab === "documents" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("documents")}
              className="text-xs gap-1.5"
            >
              3. Spatie Documents (8 Files)
              <Paperclip className="h-3 w-3" />
            </Button>
          </div>

          {/* TAB 1: Account Info */}
          {activeTab === "account" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Client Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. CL-001"
                    value={formData.clientCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clientCode: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Contact Person</label>
                  <Input
                    placeholder="e.g. Priya Sharma"
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
                    placeholder="priya@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Account Status</label>
                  <Input
                    placeholder="e.g. Active, Lead, VIP"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Billing Address</label>
                  <Input
                    placeholder="456 Business Park"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">City</label>
                  <Input
                    placeholder="Bangalore"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Pincode</label>
                  <Input
                    placeholder="560001"
                    value={formData.pincode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Account Notes</label>
                <Input
                  placeholder="Key account details or special contract terms..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Nested Locations Array */}
          {activeTab === "locations" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Multi-Warehouse Delivery Locations</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Nested locations array sent in client creation/update payload.
                  </p>
                </div>
                <Button type="button" onClick={handleAddLocationRow} size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Location
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {formData.locations?.length === 0 ? (
                  <p className="text-xs text-center p-6 text-muted-foreground border border-dashed rounded-xl">
                    No locations added yet. Click "+ Add Location" to add warehouse delivery hubs.
                  </p>
                ) : (
                  formData.locations?.map((loc, idx) => (
                    <Card key={idx} className="p-3.5 border border-border/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Location #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocationRow(idx)}
                          className="h-7 text-xs text-red-500 hover:bg-red-500/10"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Location Name * (e.g. Warehouse A)"
                          value={loc.locationName}
                          onChange={(e) => handleLocationChange(idx, "locationName", e.target.value)}
                          required
                        />
                        <Input
                          placeholder="Contact Person (e.g. Raj Kumar)"
                          value={loc.contactPerson || ""}
                          onChange={(e) => handleLocationChange(idx, "contactPerson", e.target.value)}
                        />
                      </div>

                      <Input
                        placeholder="Delivery Address (e.g. Plot 12, MIDC Industrial Zone)"
                        value={loc.deliveryAddress || ""}
                        onChange={(e) => handleLocationChange(idx, "deliveryAddress", e.target.value)}
                      />

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input
                          placeholder="Dispatch Instructions"
                          value={loc.dispatchInstruction || ""}
                          onChange={(e) => handleLocationChange(idx, "dispatchInstruction", e.target.value)}
                        />
                        <Input
                          placeholder="Transport Terms (e.g. FOB)"
                          value={loc.transportTerms || ""}
                          onChange={(e) => handleLocationChange(idx, "transportTerms", e.target.value)}
                        />
                        <Input
                          placeholder="Tax / Shipping Info"
                          value={loc.taxShippingInfo || ""}
                          onChange={(e) => handleLocationChange(idx, "taxShippingInfo", e.target.value)}
                        />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Spatie Compliance Document Uploads */}
          {activeTab === "documents" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 font-medium">
                Spatie MediaLibrary Uploads: Selecting new files will automatically submit payload as{" "}
                <code className="font-mono font-bold">multipart/form-data</code>.
              </div>

              <div className="grid gap-3 sm:grid-cols-2 max-h-[300px] overflow-y-auto pr-1">
                {DOCUMENT_LABELS.map(({ key, label }) => {
                  const currentMediaId = (formData as any)[key]
                  const selectedFile = documentFiles[key]

                  return (
                    <Card key={key} className="p-3 border border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" /> {label}
                        </span>
                        {selectedFile ? (
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                            <Check className="h-3 w-3" /> New File
                          </Badge>
                        ) : currentMediaId ? (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground font-mono">
                            Media ID: {String(currentMediaId)}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No File</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id={`file-${key}`}
                          onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                          className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                      </div>

                      {selectedFile && (
                        <p className="text-[10px] font-mono text-emerald-500 truncate">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingAdd}>
              {isSubmittingAdd ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Create Client Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Edit Client */}
      <Dialog
        open={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
        title="Edit Client Account & Documents"
        maxWidth="xl"
      >
        <form onSubmit={handleUpdateClient} className="space-y-4 mt-2">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Button
              type="button"
              variant={activeTab === "account" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("account")}
              className="text-xs"
            >
              1. Account Info
            </Button>
            <Button
              type="button"
              variant={activeTab === "locations" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("locations")}
              className="text-xs gap-1.5"
            >
              2. Locations ({formData.locations?.length || 0})
            </Button>
            <Button
              type="button"
              variant={activeTab === "documents" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("documents")}
              className="text-xs gap-1.5"
            >
              3. Spatie Documents
            </Button>
          </div>

          {activeTab === "account" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Client Code</label>
                  <Input
                    value={formData.clientCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clientCode: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Client Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                  <label className="text-xs font-semibold text-foreground">Account Status</label>
                  <Input
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Pincode</label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Account Notes</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}

          {activeTab === "locations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground">Delivery Locations Array</h4>
                <Button type="button" onClick={handleAddLocationRow} size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add Location Row
                </Button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {formData.locations?.map((loc, idx) => (
                  <Card key={idx} className="p-3.5 border border-border/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> Location #{idx + 1} {loc.id ? `(ID: ${loc.id})` : "(New)"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLocationRow(idx)}
                        className="h-7 text-xs text-red-500 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Location Name *"
                        value={loc.locationName}
                        onChange={(e) => handleLocationChange(idx, "locationName", e.target.value)}
                        required
                      />
                      <Input
                        placeholder="Contact Person"
                        value={loc.contactPerson || ""}
                        onChange={(e) => handleLocationChange(idx, "contactPerson", e.target.value)}
                      />
                    </div>

                    <Input
                      placeholder="Delivery Address"
                      value={loc.deliveryAddress || ""}
                      onChange={(e) => handleLocationChange(idx, "deliveryAddress", e.target.value)}
                    />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                Re-uploading any file triggers Laravel multipart <code className="font-mono font-bold text-primary">_method=PUT</code> spoofing.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DOCUMENT_LABELS.map(({ key, label }) => {
                  const currentMediaId = (formData as any)[key]
                  const selectedFile = documentFiles[key]

                  return (
                    <Card key={key} className="p-3 border border-border/70 space-y-2">
                      <span className="text-xs font-semibold text-foreground block">{label}</span>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                        className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary text-[11px]"
                      />
                      {selectedFile && <p className="text-[10px] font-mono text-emerald-500 truncate">Selected: {selectedFile.name}</p>}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setEditingClient(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Client Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Confirmation */}
      <Dialog open={Boolean(deletingClient)} onClose={() => setDeletingClient(null)} title="Delete Client Account">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete client account{" "}
            <strong className="text-foreground font-semibold">"{deletingClient?.name}"</strong>? This will permanently erase the
            client and its associated records.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingClient(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Client
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
