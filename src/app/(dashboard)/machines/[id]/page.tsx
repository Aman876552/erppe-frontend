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
import { machinesApi } from "@/modules/machines/lib/machines-api"
import { Machine, DepartmentOption, VendorOption } from "@/modules/machines/types/machine"
import {
  ArrowLeft,
  Wrench,
  IndianRupee,
  Calendar,
  Building2,
  Truck,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  Loader2,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  FileText,
} from "lucide-react"

export default function MachineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [machine, setMachine] = useState<Machine | null>(null)
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [vendors, setVendors] = useState<VendorOption[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Machine>>({})

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

  const fetchMachineDetail = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    try {
      const [res, deptList, vendList] = await Promise.all([
        machinesApi.getMachineById(id),
        machinesApi.getDepartments(),
        machinesApi.getVendors(),
      ])
      setMachine(res.data)
      setDepartments(deptList)
      setVendors(vendList)
    } catch (err: any) {
      console.error("Failed to load machine detail from API:", err)
      setError(err.message || "Failed to load machine profile from server.")
      setMachine(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMachineDetail()
  }, [id])

  const handleOpenEdit = () => {
    if (!machine) return
    setEditForm({ ...machine })
    setIsEditOpen(true)
  }

  const handleUpdateMachine = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!machine) return
    if (!editForm.machineName?.trim() || !editForm.brandName?.trim()) return

    setIsSubmittingEdit(true)

    try {
      const payload = {
        ...editForm,
        machineName: editForm.machineName.trim(),
        brandName: editForm.brandName.trim(),
        departmentId: Number(editForm.departmentId),
        vendorName: editForm.vendorName?.trim() || "",
        purchaseAmount: Number(editForm.purchaseAmount) || 0,
      }

      const res = await machinesApi.updateMachine(machine.id, payload)
      setMachine(res.data)
      showNotification(res.message || "Machine profile updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update machine profile.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteMachine = async () => {
    if (!machine) return
    setIsSubmittingDelete(true)

    try {
      await machinesApi.deleteMachine(machine.id)
      router.push("/machines")
    } catch (err: any) {
      setError(err.message || "Failed to delete machine.")
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

  if (!machine) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/machines" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Machine Registry
          </Link>
        </Button>
        <Card className="p-8 text-center">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Machine Entry Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            The requested Machine ID could not be loaded from the API.
          </p>
        </Card>
      </div>
    )
  }

  const displayId = machine.machineId || `MAC-${String(machine.id).padStart(5, "0")}`
  const warrantyInfo = machinesApi.getWarrantyStatus(machine.warrantyExpiryDate)
  const purchaseAmt = Number(machine.purchaseAmount) || 0

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button asChild variant="outline" size="sm">
          <Link href="/machines" className="gap-1.5 text-xs font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Machine Registry
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenEdit} size="sm" variant="outline" className="gap-1.5 text-xs">
            <Edit className="h-4 w-4" /> Edit Details
          </Button>
          <Button onClick={() => setIsDeleteOpen(true)} size="sm" variant="destructive" className="gap-1.5 text-xs">
            <Trash2 className="h-4 w-4" /> Delete Machine
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
              <Wrench className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-foreground">{machine.machineName}</h1>
                <button
                  type="button"
                  onClick={() => handleCopy(displayId)}
                  className="inline-flex items-center gap-1 font-mono text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-0.5 rounded border border-border transition-colors font-semibold"
                  title="Click to copy Machine ID"
                >
                  <span>{displayId}</span>
                  {copiedText === displayId ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{machine.brandName}</span>
                {machine.modelNumber && <span>• Model: <strong className="text-foreground">{machine.modelNumber}</strong></span>}
                {machine.serialNumber && <span>• S/N: <strong className="text-foreground font-mono">{machine.serialNumber}</strong></span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {warrantyInfo.status === "EXPIRED" && (
              <Badge variant="destructive" className="px-2.5 py-1 text-xs gap-1 font-bold">
                <ShieldAlert className="h-4 w-4" /> Warranty Expired
              </Badge>
            )}
            {warrantyInfo.status === "EXPIRING_SOON" && (
              <Badge variant="warning" className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-bold">
                <AlertTriangle className="h-4 w-4" /> Warranty Expiring Soon
              </Badge>
            )}
            {warrantyInfo.status === "ACTIVE" && (
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1 font-bold">
                <ShieldCheck className="h-4 w-4" /> Active Warranty
              </Badge>
            )}

            {(machine.status || "").toLowerCase() === "active" ? (
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold">
                Active Machine
              </Badge>
            ) : (
              <Badge variant="outline" className="px-2.5 py-1 text-xs bg-zinc-500/10 text-zinc-400 border-zinc-500/30 font-bold">
                Inactive
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Grid Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Equipment Identifiers */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" /> Plant & Supplier Mapping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Department</span>
                <span className="font-bold text-foreground">
                  {machine.department?.name || `Dept #${machine.departmentId}`}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Vendor / Supplier</span>
                <span className="font-bold text-foreground">{machine.vendorName || machine.vendor?.name || "—"}</span>
              </div>

              {machine.machinePoNumber && (
                <div className="flex justify-between font-mono">
                  <span className="text-muted-foreground font-sans">PO Reference</span>
                  <span className="font-semibold text-foreground">{machine.machinePoNumber}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Financials & Investment */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-purple-500" /> Purchase Financials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 font-mono">
              <span className="text-[10px] text-muted-foreground block font-sans">Purchase Investment</span>
              <span className="font-extrabold text-xl text-purple-600 dark:text-purple-400">
                ₹{purchaseAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-muted/40 text-center">
                <span className="text-[9px] text-muted-foreground block font-sans">Purchase Date</span>
                <span className="font-bold text-foreground">
                  {machine.purchaseDate ? new Date(machine.purchaseDate).toLocaleDateString() : "—"}
                </span>
              </div>

              <div className="p-2 rounded bg-muted/40 text-center">
                <span className="text-[9px] text-muted-foreground block font-sans">Purchase Year</span>
                <span className="font-bold text-foreground">{machine.purchaseYear || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Warranty Coverage */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Warranty Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px]">Expiry Date</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {machine.warrantyExpiryDate ? new Date(machine.warrantyExpiryDate).toLocaleDateString() : "No Expiry Date Set"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-[11px]">
              <span className="text-muted-foreground block">Warranty Standing</span>
              <span className="font-bold text-foreground mt-0.5 block">{warrantyInfo.label}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Engineer Card */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Dedicated Service Engineer Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground block text-[11px]">Engineer Name</span>
              <span className="font-bold text-foreground text-sm">{machine.engineerName || "Not assigned"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Engineer Email</span>
              {machine.engineerEmail ? (
                <a
                  href={`mailto:${machine.engineerEmail}`}
                  className="font-medium text-primary hover:underline flex items-center gap-1.5 mt-0.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{machine.engineerEmail}</span>
                </a>
              ) : (
                <span className="text-muted-foreground italic">No email address</span>
              )}
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Engineer Contact Number</span>
              {machine.engineerContact ? (
                <a
                  href={`tel:${machine.engineerContact}`}
                  className="font-medium text-foreground hover:underline flex items-center gap-1.5 mt-0.5 font-mono"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{machine.engineerContact}</span>
                </a>
              ) : (
                <span className="text-muted-foreground italic">No phone number</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card className="border border-border/60">
        <CardContent className="p-4 flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {machine.createdBy && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Registered by User ID: <strong className="text-foreground font-mono">{machine.createdBy}</strong></span>
              </div>
            )}

            {machine.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created: <strong>{new Date(machine.createdAt).toLocaleDateString()}</strong></span>
              </div>
            )}

            {machine.updatedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated: <strong>{new Date(machine.updatedAt).toLocaleDateString()}</strong></span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal: Edit Machine */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Machine Profile" maxWidth="lg">
        <form onSubmit={handleUpdateMachine} className="space-y-4 mt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Machine Name</label>
              <Input
                value={editForm.machineName || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, machineName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Brand Name</label>
              <Input
                value={editForm.brandName || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, brandName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Model Number</label>
              <Input
                value={editForm.modelNumber || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, modelNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Serial Number</label>
              <Input
                value={editForm.serialNumber || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, serialNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Department</label>
              <select
                value={editForm.departmentId || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, departmentId: parseInt(e.target.value, 10) }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground"
                required
              >
                <option value="">Select Department...</option>
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
              <label className="text-xs font-semibold text-foreground">Vendor Name</label>
              <Input
                value={editForm.vendorName || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, vendorName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Purchase Amount (₹)</label>
              <Input
                type="number"
                step="any"
                value={editForm.purchaseAmount || ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, purchaseAmount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
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

      {/* Modal: Delete Machine */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Machine Confirmation">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to permanently delete machine{" "}
            <strong className="text-foreground font-semibold">"{machine.machineName}"</strong> ({machine.brandName})?
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMachine} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Permanently
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
