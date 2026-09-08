"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { companyDocumentsApi } from "@/modules/company-documents/lib/company-documents-api"
import {
  CompanyDocument,
  CompanyDocumentQueryParams,
} from "@/modules/company-documents/types/company-document"
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
  Paperclip,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  FileCheck,
  Bell,
  RefreshCw,
} from "lucide-react"
import { openCompanyDocument, openMediaInNewTab } from "@/modules/core/lib/media"
import { DocumentPreviewModal } from "@/modules/core/components/document-preview-modal"

interface DocumentRepeaterRow {
  id: string
  documentName: string
  issueDate: string
  expiryDate: string
  reminderBeforeExpiry: string
  attachment: File | null
}

export default function CompanyDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false)

  // Document Modal State (Repeater format for Create / Single format for Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<CompanyDocument | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Repeater State
  const [repeaterRows, setRepeaterRows] = useState<DocumentRepeaterRow[]>([
    {
      id: "1",
      documentName: "",
      issueDate: "",
      expiryDate: "",
      reminderBeforeExpiry: "",
      attachment: null,
    },
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
  }, [searchQuery, expiringSoonOnly])

  // Open Create Dialog with clean repeater
  const handleOpenCreate = () => {
    setEditingDoc(null)
    setRepeaterRows([
      {
        id: Math.random().toString(),
        documentName: "",
        issueDate: "",
        expiryDate: "",
        reminderBeforeExpiry: "",
        attachment: null,
      },
    ])
    setIsModalOpen(true)
  }

  // Open Edit Dialog for single document
  const handleOpenEdit = (doc: CompanyDocument) => {
    setEditingDoc(doc)
    setRepeaterRows([
      {
        id: String(doc.id),
        documentName: doc.documentName,
        issueDate: doc.issueDate ? doc.issueDate.split("T")[0] : "",
        expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
        reminderBeforeExpiry: doc.reminderBeforeExpiry ? doc.reminderBeforeExpiry.split("T")[0] : "",
        attachment: null,
      },
    ])
    setIsModalOpen(true)
  }

  // Repeater handlers
  const handleAddRepeaterRow = () => {
    setRepeaterRows((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        documentName: "",
        issueDate: "",
        expiryDate: "",
        reminderBeforeExpiry: "",
        attachment: null,
      },
    ])
  }

  const handleRemoveRepeaterRow = (index: number) => {
    setRepeaterRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRepeaterRow = (index: number, field: keyof DocumentRepeaterRow, value: any) => {
    setRepeaterRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  // Submit Handler for Add / Edit
  const handleSubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault()

    const validRows = repeaterRows.filter((r) => r.documentName.trim().length > 0)
    if (validRows.length === 0) {
      setError("Please enter a Document Name for at least one record.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (editingDoc) {
        // Edit mode
        const row = validRows[0]
        await companyDocumentsApi.updateCompanyDocument(editingDoc.id, {
          documentName: row.documentName,
          issueDate: row.issueDate || undefined,
          expiryDate: row.expiryDate || undefined,
          reminderBeforeExpiry: row.reminderBeforeExpiry || undefined,
          attachment: row.attachment,
        })
        showNotification(`Document "${row.documentName}" updated successfully.`)
      } else {
        // Multi-create repeater mode
        await Promise.all(
          validRows.map((row) =>
            companyDocumentsApi.createCompanyDocument({
              documentName: row.documentName,
              issueDate: row.issueDate || undefined,
              expiryDate: row.expiryDate || undefined,
              reminderBeforeExpiry: row.reminderBeforeExpiry || undefined,
              attachment: row.attachment,
            })
          )
        )
        showNotification(`${validRows.length} document record(s) created successfully.`)
      }

      setIsModalOpen(false)
      fetchDocuments()
    } catch (err: any) {
      setError(err.message || "Failed to save company document(s).")
    } finally {
      setIsSubmitting(false)
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
  const attachedCount = documents.filter((d) => Boolean(d.attachmentUrl || d.media?.url)).length
  const expiringCount = documents.filter((d) => {
    if (!d.expiryDate) return false
    const todayStr = new Date().toISOString().split("T")[0]
    return d.expiryDate >= todayStr
  }).length

  // Format date helper
  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return null
    return dateStr.includes("T") ? dateStr.split("T")[0] : dateStr
  }

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
      key: "issueDate",
      title: "Issue Date",
      render: (row) =>
        row.issueDate ? (
          <span className="text-xs font-mono text-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" /> {formatDateDisplay(row.issueDate)}
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
          <span className="text-xs font-mono font-semibold text-foreground flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" /> {formatDateDisplay(row.expiryDate)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">No Expiry</span>
        ),
    },
    {
      key: "reminderBeforeExpiry",
      title: "Reminder Before Expiry",
      render: (row) =>
        row.reminderBeforeExpiry ? (
          <span className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-primary" /> {formatDateDisplay(row.reminderBeforeExpiry)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">No Reminder</span>
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
            onClick={() => openCompanyDocument(row)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium text-[11px] hover:bg-emerald-500/20 transition-colors cursor-pointer select-none"
            title="Open attachment in new tab"
          >
            <Paperclip className="h-3 w-3" />
            <span className="max-w-[140px] truncate">{fileName}</span>
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
        description="Manage legal certificates, compliance files, permits, and track expiry reminders."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={fetchDocuments} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
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
      <div className="grid gap-4 sm:grid-cols-3">
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
            <span className="text-xs font-semibold text-muted-foreground">Attached Files</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{attachedCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">File attachments uploaded</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Expiries</span>
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
              placeholder="Search by document name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
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

      {/* Repeater Modal for Add / Edit Company Documents */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoc ? "Edit Company Document" : "Add Company Document"}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitDocuments} className="space-y-6 mt-2">
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {repeaterRows.map((row, idx) => (
              <div key={row.id} className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4 shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                      DOCUMENT RECORD #{idx + 1}
                    </span>
                  </div>
                  {repeaterRows.length > 1 && !editingDoc && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRepeaterRow(idx)}
                      className="text-red-500 hover:text-red-600 h-7 px-2 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                {/* Row 1: Document Name & Attachment File */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Document Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={row.documentName}
                      onChange={(e) => updateRepeaterRow(idx, "documentName", e.target.value)}
                      placeholder="e.g. GST Registration Certificate"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">
                      Attachment File {!editingDoc && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative flex items-center justify-between rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-1.5 text-xs hover:border-primary transition-colors">
                      <div className="flex items-center gap-2 text-muted-foreground overflow-hidden pr-2">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate max-w-[160px]">
                          {row.attachment ? row.attachment.name : "Choose or drop document..."}
                        </span>
                      </div>
                      <label className="shrink-0 cursor-pointer rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                        Browse
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            updateRepeaterRow(idx, "attachment", file)
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 2: Issue Date, Expiry Date, Reminder Before Expiry */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Issue Date</label>
                    <Input
                      type="date"
                      value={row.issueDate}
                      onChange={(e) => updateRepeaterRow(idx, "issueDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                    <Input
                      type="date"
                      value={row.expiryDate}
                      onChange={(e) => updateRepeaterRow(idx, "expiryDate", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Reminder Before Expiry</label>
                    <Input
                      type="date"
                      value={row.reminderBeforeExpiry}
                      onChange={(e) => updateRepeaterRow(idx, "reminderBeforeExpiry", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
            <div>
              {!editingDoc && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRepeaterRow}
                  className="gap-2 border-primary/40 text-primary hover:bg-primary/5 text-xs font-semibold"
                >
                  <Plus className="h-4 w-4" /> Add Another Document
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={isSubmitting} className="min-w-[130px]">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {editingDoc ? "Save Changes" : "Save Documents"}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
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

      {/* Private Media Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  )
}
