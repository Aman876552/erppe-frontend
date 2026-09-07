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
import { clientsApi } from "@/modules/clients/lib/clients-api"
import {
  Client,
  ClientLocation,
  CreateClientPayload,
  ClientDocumentFiles,
} from "@/modules/clients/types/client"
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
  Upload,
  Plus,
  Compass,
  Paperclip,
  FileCheck,
  CreditCard,
  ShieldCheck,
} from "lucide-react"

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [locations, setLocations] = useState<ClientLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editTab, setEditTab] = useState<"account" | "locations" | "documents">("account")

  // Add Standalone Location Modal State
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false)
  const [locationForm, setLocationForm] = useState({
    locationName: "",
    contactPerson: "",
    deliveryAddress: "",
    dispatchInstruction: "",
    transportTerms: "",
    taxShippingInfo: "",
  })

  // Delete Standalone Location State
  const [deletingLocationId, setDeletingLocationId] = useState<string | number | null>(null)

  // Delete Client Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Edit Client Form Payload
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

  // Edit Client File Attachments
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

  const fetchClientDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await clientsApi.getClientById(clientId)
      setClient(res.data)
      setLocations(res.data.locations || [])
    } catch (err: any) {
      setError(err.message || "Failed to load client profile.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchClientDetail()
    }
  }, [clientId])

  const handleOpenEdit = () => {
    if (!client) return
    setFormData({
      clientCode: client.clientCode || "",
      name: client.name || "",
      contact: client.contact || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      pincode: client.pincode || "",
      status: client.status || "Active",
      notes: client.notes || "",
      locations: (client.locations || []).map((loc) => ({
        id: loc.id,
        locationName: loc.locationName,
        contactPerson: loc.contactPerson || "",
        deliveryAddress: loc.deliveryAddress || "",
        dispatchInstruction: loc.dispatchInstruction || "",
        transportTerms: loc.transportTerms || "",
        taxShippingInfo: loc.taxShippingInfo || "",
      })),
      panCard: client.panCard,
      gstCertificate: client.gstCertificate,
      cinIncorporation: client.cinIncorporation,
      msmeUdyam: client.msmeUdyam,
      iecCertificate: client.iecCertificate,
      cancelledCheque: client.cancelledCheque,
      agreementContract: client.agreementContract,
      otherCompliance: client.otherCompliance,
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
    setEditTab("account")
    setIsEditOpen(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await clientsApi.updateClient(client.id, formData, documentFiles)
      setClient((prev) => (prev ? { ...prev, ...res.data } : res.data))
      setLocations(res.data.locations || [])
      showNotification("Client account profile updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update client profile.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!client) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      await clientsApi.deleteClient(client.id)
      router.push("/clients")
    } catch (err: any) {
      setError(err.message || "Failed to delete client account.")
      setIsSubmittingDelete(false)
    }
  }

  // Standalone Location Handlers (/api/client-locations)
  const handleAddStandaloneLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    setIsSubmittingLocation(true)
    setError(null)

    try {
      const res = await clientsApi.createClientLocation({
        clientId: client.id,
        ...locationForm,
      })
      setLocations((prev) => [...prev, res.data])
      showNotification(`Location "${res.data.locationName}" added successfully.`)
      setLocationForm({
        locationName: "",
        contactPerson: "",
        deliveryAddress: "",
        dispatchInstruction: "",
        transportTerms: "",
        taxShippingInfo: "",
      })
      setIsAddLocationOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to add client location.")
    } finally {
      setIsSubmittingLocation(false)
    }
  }

  const handleDeleteStandaloneLocation = async (locId: string | number) => {
    setDeletingLocationId(locId)
    setError(null)
    try {
      await clientsApi.deleteClientLocation(locId)
      setLocations((prev) => prev.filter((loc) => String(loc.id) !== String(locId)))
      showNotification("Client location deleted successfully.")
    } catch (err: any) {
      setError(err.message || "Failed to delete client location.")
    } finally {
      setDeletingLocationId(null)
    }
  }

  // File Change Handler for Edit Modal
  const handleFileChange = (field: keyof ClientDocumentFiles, file: File | null) => {
    setDocumentFiles((prev) => ({ ...prev, [field]: file }))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading client account profile...</span>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Client Not Found"
          description={`Client record #${clientId} does not exist.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Client Directory
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const docFields: { key: keyof ClientDocumentFiles; label: string; idValue?: string | number | null }[] = [
    { key: "panCard", label: "PAN Card Document", idValue: client.panCard },
    { key: "gstCertificate", label: "GST Certificate", idValue: client.gstCertificate },
    { key: "cinIncorporation", label: "CIN Incorporation Certificate", idValue: client.cinIncorporation },
    { key: "msmeUdyam", label: "MSME Udyam Certificate", idValue: client.msmeUdyam },
    { key: "iecCertificate", label: "IEC Export Certificate", idValue: client.iecCertificate },
    { key: "cancelledCheque", label: "Cancelled Cheque", idValue: client.cancelledCheque },
    { key: "agreementContract", label: "Agreement / Contract", idValue: client.agreementContract },
    { key: "otherCompliance", label: "Other Compliance Record", idValue: client.otherCompliance },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={client.name}
        description={`Client Profile & Nested Locations (Code: ${client.clientCode || clientId})`}
        badge={
          <Badge
            variant={
              client.status?.toLowerCase() === "active"
                ? "success"
                : client.status?.toLowerCase() === "inactive"
                ? "destructive"
                : "secondary"
            }
            className="gap-1 font-mono"
          >
            {client.status || "Active"}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/clients">
                <ArrowLeft className="h-4 w-4" /> Back to Directory
              </Link>
            </Button>
            <Button onClick={handleOpenEdit} variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Edit Client
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

      {/* Top Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending Payment</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{Number(client.pendingPayment || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Outstanding balance</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{client.ordersCount || 0}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Client orders processed</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Avg Order Amount</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{Number(client.avgOrderAmount || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Average order size</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Delivery Locations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{locations.length}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Configured plant/warehouses</span>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Client Primary Contact & Info */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Client Profile & Primary Office
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Client Name</span>
              <span className="font-bold text-foreground">{client.name}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Client Code</span>
              <span className="font-mono font-semibold text-primary">{client.clientCode}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Contact Person</span>
              <span className="font-semibold text-foreground">{client.contact || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" /> Phone
              </span>
              <span className="font-semibold text-foreground">{client.phone || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 text-primary" /> Email
              </span>
              <span className="font-semibold text-foreground font-mono">{client.email || "—"}</span>
            </div>

            <div className="flex justify-between items-start pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-500" /> Main Office Address
              </span>
              <div className="text-right font-medium text-foreground max-w-[220px]">
                {client.address || "—"}
                {(client.city || client.state || client.pincode) && (
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    {[client.city, client.state, client.pincode].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-medium block">Internal Notes</span>
              <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                {client.notes || "No internal notes recorded for this client."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Spatie MediaLibrary Documents */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Compliance Documents (Spatie Media)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleOpenEdit} className="gap-1 text-[11px]">
              <Upload className="h-3 w-3" /> Upload Files
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {docFields.map((doc) => {
              const hasMedia = doc.idValue !== null && doc.idValue !== undefined
              return (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Paperclip className={`h-3.5 w-3.5 ${hasMedia ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <span className="font-medium text-foreground">{doc.label}</span>
                  </div>
                  {hasMedia ? (
                    <Badge variant="success" className="gap-1 text-[10px]">
                      <FileCheck className="h-3 w-3" /> Stored (ID: {String(doc.idValue)})
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">Not Uploaded</span>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Standalone Client Locations Management Section */}
      <Card className="border border-border/60">
        <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" /> Delivery & Dispatch Locations ({locations.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Manage client plants, warehouses, and standalone shipping points.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAddLocationOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add Location
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {locations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No delivery locations configured for this client. Click "Add Location" to register a plant or warehouse.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {locations.map((loc) => (
                <div key={loc.id || loc.locationName} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{loc.locationName}</span>
                      {loc.contactPerson && (
                        <Badge variant="secondary" className="text-[10px]">
                          Contact: {loc.contactPerson}
                        </Badge>
                      )}
                    </div>
                    {loc.deliveryAddress && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" /> {loc.deliveryAddress}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      {loc.dispatchInstruction && <span>Dispatch: {loc.dispatchInstruction}</span>}
                      {loc.transportTerms && <span>Terms: {loc.transportTerms}</span>}
                      {loc.taxShippingInfo && <span>Tax/Ship: {loc.taxShippingInfo}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loc.id && handleDeleteStandaloneLocation(loc.id)}
                      disabled={deletingLocationId === loc.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      {deletingLocationId === loc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Edit Client Account & Nested Locations & Documents */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Client Profile" maxWidth="2xl">
        <div className="space-y-4 mt-2">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setEditTab("account")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                editTab === "account" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              1. Account Info
            </button>
            <button
              type="button"
              onClick={() => setEditTab("locations")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                editTab === "locations" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              2. Nested Locations ({formData.locations?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setEditTab("documents")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                editTab === "documents" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              3. Spatie Documents (8 Files)
            </button>
          </div>

          <form onSubmit={handleUpdateClient} className="space-y-4">
            {editTab === "account" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Client Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Client Code *</label>
                    <Input
                      value={formData.clientCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientCode: e.target.value }))}
                      required
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
                    <label className="text-xs font-semibold text-foreground">Status</label>
                    <Input
                      value={formData.status}
                      onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                      placeholder="e.g. Active, Inactive, Pending"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
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
                    <label className="text-xs font-semibold text-foreground">Pincode</label>
                    <Input
                      value={formData.pincode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Internal Notes</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {editTab === "locations" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Client Delivery Locations</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
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
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3 w-3" /> Add Location Row
                  </Button>
                </div>

                {formData.locations?.map((loc, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-border/40">
                      <span className="font-semibold text-foreground">
                        Location #{idx + 1} {loc.id ? `(ID: ${loc.id} - Edit)` : "(New)"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            locations: prev.locations?.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-red-500 hover:text-red-600"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Location Name *"
                        value={loc.locationName}
                        onChange={(e) => {
                          const newLocs = [...(formData.locations || [])]
                          newLocs[idx].locationName = e.target.value
                          setFormData((prev) => ({ ...prev, locations: newLocs }))
                        }}
                        required
                      />
                      <Input
                        placeholder="Contact Person"
                        value={loc.contactPerson || ""}
                        onChange={(e) => {
                          const newLocs = [...(formData.locations || [])]
                          newLocs[idx].contactPerson = e.target.value
                          setFormData((prev) => ({ ...prev, locations: newLocs }))
                        }}
                      />
                    </div>

                    <Input
                      placeholder="Delivery Address"
                      value={loc.deliveryAddress || ""}
                      onChange={(e) => {
                        const newLocs = [...(formData.locations || [])]
                        newLocs[idx].deliveryAddress = e.target.value
                        setFormData((prev) => ({ ...prev, locations: newLocs }))
                      }}
                    />

                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        placeholder="Dispatch Instruction"
                        value={loc.dispatchInstruction || ""}
                        onChange={(e) => {
                          const newLocs = [...(formData.locations || [])]
                          newLocs[idx].dispatchInstruction = e.target.value
                          setFormData((prev) => ({ ...prev, locations: newLocs }))
                        }}
                      />
                      <Input
                        placeholder="Transport Terms"
                        value={loc.transportTerms || ""}
                        onChange={(e) => {
                          const newLocs = [...(formData.locations || [])]
                          newLocs[idx].transportTerms = e.target.value
                          setFormData((prev) => ({ ...prev, locations: newLocs }))
                        }}
                      />
                      <Input
                        placeholder="Tax Shipping Info"
                        value={loc.taxShippingInfo || ""}
                        onChange={(e) => {
                          const newLocs = [...(formData.locations || [])]
                          newLocs[idx].taxShippingInfo = e.target.value
                          setFormData((prev) => ({ ...prev, locations: newLocs }))
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editTab === "documents" && (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                <p className="text-[11px] text-muted-foreground">
                  Attach new file uploads. Submitting files automatically uses multipart form-data with Laravel method
                  spoofing (<code className="bg-muted px-1 py-0.5 rounded">_method: 'PUT'</code>).
                </p>

                {docFields.map((doc) => {
                  const existingMediaId = doc.idValue
                  const selectedFile = documentFiles[doc.key]

                  return (
                    <div key={doc.key} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{doc.label}</span>
                        {existingMediaId && !selectedFile && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Current Media ID: {String(existingMediaId)}
                          </Badge>
                        )}
                        {selectedFile && (
                          <Badge variant="success" className="text-[10px]">
                            New File Selected
                          </Badge>
                        )}
                      </div>

                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          handleFileChange(doc.key, file)
                        }}
                        className="text-xs cursor-pointer"
                      />
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isSubmittingEdit}>
                {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Client Changes
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Modal 2: Add Standalone Location */}
      <Dialog open={isAddLocationOpen} onClose={() => setIsAddLocationOpen(false)} title="Add Client Location">
        <form onSubmit={handleAddStandaloneLocation} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Location Name *</label>
            <Input
              value={locationForm.locationName}
              onChange={(e) => setLocationForm((prev) => ({ ...prev, locationName: e.target.value }))}
              placeholder="e.g. Warehouse B or Sector 5 Plant"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Contact Person</label>
            <Input
              value={locationForm.contactPerson}
              onChange={(e) => setLocationForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
              placeholder="e.g. Raj Kumar"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Delivery Address</label>
            <Input
              value={locationForm.deliveryAddress}
              onChange={(e) => setLocationForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))}
              placeholder="e.g. Plot 12, MIDC Industrial Area"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Dispatch Instruction</label>
              <Input
                value={locationForm.dispatchInstruction}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, dispatchInstruction: e.target.value }))}
                placeholder="e.g. Call before delivery"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Transport Terms</label>
              <Input
                value={locationForm.transportTerms}
                onChange={(e) => setLocationForm((prev) => ({ ...prev, transportTerms: e.target.value }))}
                placeholder="e.g. FOB or CIF"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tax / Shipping Info</label>
            <Input
              value={locationForm.taxShippingInfo}
              onChange={(e) => setLocationForm((prev) => ({ ...prev, taxShippingInfo: e.target.value }))}
              placeholder="e.g. GST Applicable"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsAddLocationOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingLocation}>
              {isSubmittingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Add Location
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Client Confirmation */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Client Account">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete client account{" "}
            <strong className="text-foreground font-semibold">"{client.name}"</strong>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
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
