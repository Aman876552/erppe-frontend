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
import { fabricatorsApi } from "@/modules/fabricators/lib/fabricators-api"
import { Fabricator, CreateFabricatorPayload, FabricatorStatus } from "@/modules/fabricators/types/fabricator"
import {
  ArrowLeft,
  Factory,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  Wrench,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Check,
  XCircle,
} from "lucide-react"

export default function FabricatorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fabricatorId = params.id as string

  const [fabricator, setFabricator] = useState<Fabricator | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

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

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchFabricatorDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fabricatorsApi.getFabricatorById(fabricatorId)
      setFabricator(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load fabricator details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (fabricatorId) {
      fetchFabricatorDetail()
    }
  }, [fabricatorId])

  const handleOpenEdit = () => {
    if (!fabricator) return
    setFormData({
      fabricatorName: fabricator.fabricatorName || "",
      contactPerson: fabricator.contactPerson || "",
      mobileNumber: fabricator.mobileNumber || "",
      fabricationType: fabricator.fabricationType || "Steel Fabrication",
      email: fabricator.email || "",
      address: fabricator.address || "",
      city: fabricator.city || "",
      gstNumber: fabricator.gstNumber || "",
      status: fabricator.status || "Active",
      remarks: fabricator.remarks || "",
    })
    setIsEditOpen(true)
  }

  const handleUpdateFabricator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fabricator) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await fabricatorsApi.updateFabricator(fabricator.id, formData)
      setFabricator((prev) => (prev ? { ...prev, ...res.data } : res.data))
      showNotification("Fabricator profile updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update fabricator.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteFabricator = async () => {
    if (!fabricator) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      await fabricatorsApi.deleteFabricator(fabricator.id)
      router.push("/fabricators")
    } catch (err: any) {
      setError(err.message || "Failed to delete fabricator.")
      setIsSubmittingDelete(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="text-xs text-muted-foreground">Loading fabricator details...</span>
        </div>
      </div>
    )
  }

  if (!fabricator) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Fabricator Not Found"
          description={`Fabricator record ${fabricatorId} does not exist.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/fabricators">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Directory
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const isActive = fabricator.status === "Active" || !fabricator.status

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={fabricator.fabricatorName}
        description={`Fabrication Partner Workshop (ID: ${fabricator.id})`}
        badge={
          isActive ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 gap-1 font-semibold">
              <Check className="h-3 w-3" /> Active Partner
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-400 gap-1 font-semibold">
              <XCircle className="h-3 w-3" /> Inactive
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/fabricators">
                <ArrowLeft className="h-4 w-4" /> Back to Directory
              </Link>
            </Button>
            <Button onClick={handleOpenEdit} variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
            <Button onClick={() => setIsDeleteOpen(true)} variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
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

      {/* Top Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Fabrication Type</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-foreground truncate">
            {fabricator.fabricationType || "General"}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Specialized process</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Key Contact</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-foreground truncate">{fabricator.contactPerson}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Primary Manager</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Mobile Contact</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-foreground font-mono">{fabricator.mobileNumber}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Direct Phone</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Location Hub</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-foreground">{fabricator.city || "Not Specified"}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Workshop City</span>
        </Card>
      </div>

      {/* Main Details Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Workshop Profile */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Factory className="h-4 w-4 text-purple-600" /> Workshop & Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Fabricator Name</span>
              <span className="font-bold text-foreground">{fabricator.fabricatorName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Contact Person</span>
              <span className="font-semibold text-foreground">{fabricator.contactPerson}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" /> Mobile Number
              </span>
              <span className="font-semibold text-foreground font-mono">{fabricator.mobileNumber}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Mail className="h-3 w-3 text-primary" /> Email Address
              </span>
              <span className="font-semibold text-foreground font-mono">{fabricator.email || "—"}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-500" /> Workshop Address
              </span>
              <div className="text-right font-medium text-foreground max-w-[220px]">
                {fabricator.address || "—"}
                {fabricator.city && <span className="block text-[11px] text-muted-foreground mt-0.5">{fabricator.city}</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Specialization & Remarks */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" /> Registration & Remarks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">GST Number</span>
              <span className="font-bold text-foreground font-mono">{fabricator.gstNumber || "Not Provided"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Fabrication Process</span>
              <span className="font-semibold text-foreground">{fabricator.fabricationType}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Operational Status</span>
              <span className="font-bold text-foreground">{fabricator.status || "Active"}</span>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-medium block">Specialization Remarks</span>
              <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                {fabricator.remarks || "No additional remarks recorded for this fabricator."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal 1: Edit Fabricator */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Fabricator Profile" maxWidth="lg">
        <form onSubmit={handleUpdateFabricator} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Fabricator Name</label>
              <Input
                value={formData.fabricatorName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fabricatorName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Fabrication Type</label>
              <Input
                value={formData.fabricationType}
                onChange={(e) => setFormData((prev) => ({ ...prev, fabricationType: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Contact Person</label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mobile Number</label>
              <Input
                value={formData.mobileNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
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
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Fabricator Profile">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete fabricator profile{" "}
            <strong className="text-foreground font-semibold">"{fabricator.fabricatorName}"</strong>? This will permanently erase the
            workshop record.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
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
