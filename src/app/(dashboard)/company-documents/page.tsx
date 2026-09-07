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
import { companyDocumentsApi } from "@/modules/company-documents/lib/company-documents-api"
import {
  CompanyDocument,
  CreateCompanyDocumentPayload,
  CompanyDocumentQueryParams,
} from "@/modules/company-documents/types/company-document"
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Paperclip,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  ShieldAlert,
  Layers,
  Filter,
  FileCheck,
  Bell,
  RefreshCw,
} from "lucide-react"
import { openMediaInNewTab } from "@/modules/core/lib/media"
import { DocumentPreviewModal } from "@/modules/core/components/document-preview-modal"

export default function CompanyDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [privacyFilter, setPrivacyFilter] = useState<string>("all") // "all" | "private" | "public"
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false)

  // Single Document Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<CompanyDocument | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<CreateCompanyDocumentPayload>({
    documentName: "",
    isPrivate: false,
    issueDate: "",
    expiryDate: "",
    reminderBeforeExpiry: 30,
    notes: "",
    attachment: null,
  })

  // Bulk Create Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)
  const [bulkRows, setBulkRows] = useState<CreateCompanyDocumentPayload[]>([
    { documentName: "", isPrivate: false, expiryDate: "", reminderBeforeExpiry: 30 },
  ])

  // Delete Modal State
  const [deleteDoc, setDeleteDoc] = useState<CompanyDocument | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchDocuments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: CompanyDocumentQueryParams = {}
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (privacyFilter === "private") params.isPrivate = true
      if (privacyFilter === "public") params.isPrivate = false
      if (expiringSoonOnly) params.expiringSoon = true

      const res = await companyDocumentsApi.getCompanyDocuments(params)
      setDocuments(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load company documents.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, privacyFilter, expiringSoonOnly])

  // Form Reset for Single Create / Edit
  const handleOpenCreate = () => {
    setEditingDoc(null)
    setFormData({
      documentName: "",
      isPrivate: false,
      issueDate: "",
      expiryDate: "",
      reminderBeforeExpiry: 30,
      notes: "",
      attachment: null,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (doc: CompanyDocument) => {
    setEditingDoc(doc)
    setFormData({
      documentName: doc.documentName,
      isPrivate: Boolean(doc.isPrivate),
      issueDate: doc.issueDate || "",
      expiryDate: doc.expiryDate || "",
      reminderBeforeExpiry: doc.reminderBeforeExpiry ?? 30,
      notes: doc.notes || "",
      attachment: null,
    })
    setIsModalOpen(true)
  }

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (editingDoc) {
        await companyDocumentsApi.updateCompanyDocument(editingDoc.id, formData)
        showNotification(`Document "${formData.documentName}" updated successfully.`)
      } else {
        await companyDocumentsApi.createCompanyDocument(formData)
        showNotification(`Document "${formData.documentName}" created successfully.`)
      }
      setIsModalOpen(false)
      fetchDocuments()
    } catch (err: any) {
      setError(err.message || "Failed to save company document.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bulk Create Handlers
  const handleOpenBulk = () => {
    setBulkRows([
      { documentName: "", isPrivate: false, expiryDate: "", reminderBeforeExpiry: 30 },
      { documentName: "", isPrivate: false, expiryDate: "", reminderBeforeExpiry: 30 },
    ])
    setIsBulkOpen(true)
  }

  const handleAddBulkRow = () => {
    setBulkRows((prev) => [
      ...prev,
      { documentName: "", isPrivate: false, expiryDate: "", reminderBeforeExpiry: 30 },
    ])
  }

  const handleRemoveBulkRow = (index: number) => {
    setBulkRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    const validRows = bulkRows.filter((r) => r.documentName.trim().length > 0)
    if (validRows.length === 0) {
      setError("Please provide at least one valid document name.")
      return
    }

    setIsSubmittingBulk(true)
    setError(null)

    try {
      await companyDocumentsApi.bulkCreateCompanyDocuments({ documents: validRows })
      showNotification(`${validRows.length} company documents created in bulk.`)
      setIsBulkOpen(false)
      fetchDocuments()
    } catch (err: any) {
      setError(err.message || "Failed to create bulk documents.")
    } finally {
      setIsSubmittingBulk(false)
    }
  }

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return
    setIsSubmittingDelete(true)
    setError(null)

    try {
      await companyDocumentsApi.deleteCompanyDocument(deleteDoc.id)
      showNotification(`Document "${deleteDoc.documentName}" deleted successfully.`)
      setDeleteDoc(null)
      fetchDocuments()
    } catch (err: any) {
      setError(err.message || "Failed to delete document.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Calculate Metrics
  const totalCount = documents.length
  const privateCount = documents.filter((d) => Boolean(d.isPrivate)).length
  const attachedCount = documents.filter((d) => Boolean(d.attachmentUrl || d.media?.url)).length
  const expiringCount = documents.filter((d) => {
    if (!d.expiryDate) return false
    const todayStr = new Date().toISOString().split("T")[0]
    return d.expiryDate >= todayStr
  }).length

  // Columns for DataTable
  const columns: Column<CompanyDocument>[] = [
    {
      key: "documentName",
      title: "Document Name",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <Link
              href={`/company-documents/${row.id}`}
              className="font-bold text-foreground hover:text-primary transition-colors text-xs"
            >
              {row.documentName}
            </Link>
            <span className="block text-[10px] text-muted-foreground font-mono">ID: #{row.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: "isPrivate",
      title: "Access Level",
      render: (row) =>
        row.isPrivate ? (
          <Badge variant="destructive" className="gap-1 text-[10px] font-medium">
            <Lock className="h-3 w-3" /> Private
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
            <Unlock className="h-3 w-3" /> Public
          </Badge>
        ),
    },
    {
      key: "issueDate",
      title: "Issue Date",
      render: (row) =>
        row.issueDate ? (
          <span className="text-xs font-mono text-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" /> {row.issueDate}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">—</span>
        ),
    },
    {
      key: "expiryDate",
      title: "Expiry Date",
      render: (row) =>
        row.expiryDate ? (
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-semibold text-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" /> {row.expiryDate}
            </span>
            {row.reminderBeforeExpiry !== undefined && row.reminderBeforeExpiry !== null && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Bell className="h-2.5 w-2.5 text-primary" /> Remind {row.reminderBeforeExpiry}d prior
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">No Expiry</span>
        ),
    },
    {
      key: "attachmentUrl",
      title: "Attachment File",
      render: (row) => {
        const fileUrl = row.attachmentUrl || row.media?.url
        const fileName = row.media?.file_name || "Attachment"
        return fileUrl ? (
          <button
            type="button"
            onClick={() =>
              openMediaInNewTab({
                isPrivate: Boolean(row.isPrivate),
                attachmentUrl: fileUrl,
                documentName: row.documentName,
                mimeType: row.media?.mime_type,
              })
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] hover:bg-emerald-500/20 transition-colors cursor-pointer select-none"
            title="Open attachment in new tab"
          >
            <Paperclip className="h-3 w-3" />
            <span className="max-w-[120px] truncate">{fileName}</span>
            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">No File</span>
        )
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Document Profile">
            <Link href={`/company-documents/${row.id}`}>
              <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="h-7 w-7 p-0"
            title="Edit Document"
          >
            <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDoc(row)}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            title="Delete Document"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Company Documents"
        description="Manage legal certificates, compliance files, private permits, and track expiry reminders."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchDocuments} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={handleOpenBulk} variant="outline" size="sm" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Bulk Add
            </Button>
            <Button onClick={handleOpenCreate} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Document
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

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Documents</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{totalCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Registered in database</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Private Files</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{privateCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Restricted internal access</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Attached Media</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{attachedCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Spatie Media attachments</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Expiring / Active</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{expiringCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Tracked expiry dates</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by document name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Privacy Filter */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 border border-border/50">
              <button
                type="button"
                onClick={() => setPrivacyFilter("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  privacyFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPrivacyFilter("public")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  privacyFilter === "public" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setPrivacyFilter("private")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  privacyFilter === "private" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Private
              </button>
            </div>

            {/* Expiring Soon Toggle */}
            <Button
              type="button"
              variant={expiringSoonOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setExpiringSoonOnly(!expiringSoonOnly)}
              className="gap-1.5 text-xs"
            >
              <Clock className="h-3.5 w-3.5" /> Expiring Soon
            </Button>
          </div>
        </div>
      </Card>

      {/* Main DataTable */}
      <Card className="border border-border/60">
        <DataTable
          columns={columns}
          data={documents}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
        />
      </Card>

      {/* Modal 1: Single Document Create / Edit */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoc ? "Edit Company Document" : "Add Company Document"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitSingle} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Document Name *</label>
            <Input
              value={formData.documentName}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentName: e.target.value }))}
              placeholder="e.g. Trade License 2026 or GST Certificate"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Issue Date (YYYY-MM-DD)</label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Expiry Date (YYYY-MM-DD)</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 items-center">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reminder Before Expiry (Days)</label>
              <Input
                type="number"
                min={0}
                value={formData.reminderBeforeExpiry ?? 30}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reminderBeforeExpiry: parseInt(e.target.value) || 0 }))
                }
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="isPrivateCheck"
                checked={Boolean(formData.isPrivate)}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPrivate: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="isPrivateCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                Mark as Private / Restricted Document
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes / Internal Context</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Renewed annually with municipal authority"
            />
          </div>

          {/* Attachment Upload Field */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Attachment File
              </label>
              {editingDoc?.attachmentUrl && (
                <span className="text-[11px] text-emerald-500 font-medium">Existing file attached</span>
              )}
            </div>

            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setFormData((prev) => ({ ...prev, attachment: file }))
              }}
              className="text-xs cursor-pointer"
            />

            {editingDoc && (
              <p className="text-[11px] text-amber-500 flex items-center gap-1.5 pt-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Notice: Uploading a new file will replace and clear the previous attachment.</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {editingDoc ? "Save Changes" : "Create Document"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Bulk Create Documents */}
      <Dialog open={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Add Company Documents" maxWidth="xl">
        <form onSubmit={handleSubmitBulk} className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground">
            Create multiple document records in a single request. Attachments can be uploaded later on individual document profiles.
          </p>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {bulkRows.map((row, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                  <span className="font-semibold text-foreground">Document Entry #{idx + 1}</span>
                  {bulkRows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBulkRow(idx)}
                      className="text-red-500 hover:text-red-600 h-6 px-2 text-[11px]"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Document Name *"
                    value={row.documentName}
                    onChange={(e) => {
                      const newRows = [...bulkRows]
                      newRows[idx].documentName = e.target.value
                      setBulkRows(newRows)
                    }}
                    required
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      placeholder="Expiry Date"
                      value={row.expiryDate || ""}
                      onChange={(e) => {
                        const newRows = [...bulkRows]
                        newRows[idx].expiryDate = e.target.value
                        setBulkRows(newRows)
                      }}
                    />
                    <label className="flex items-center gap-1 shrink-0 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(row.isPrivate)}
                        onChange={(e) => {
                          const newRows = [...bulkRows]
                          newRows[idx].isPrivate = e.target.checked
                          setBulkRows(newRows)
                        }}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      Private
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleAddBulkRow} className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add Another Row
            </Button>

            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setIsBulkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isSubmittingBulk}>
                {isSubmittingBulk ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Save Bulk Documents
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Confirmation */}
      <Dialog open={Boolean(deleteDoc)} onClose={() => setDeleteDoc(null)} title="Delete Company Document">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete document record{" "}
            <strong className="text-foreground font-semibold">"{deleteDoc?.documentName}"</strong>? This will permanently remove the record and its attached file.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Document
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal 4: Private Media Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  )
}
