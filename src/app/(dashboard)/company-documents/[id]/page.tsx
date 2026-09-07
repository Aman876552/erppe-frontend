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
import { companyDocumentsApi } from "@/modules/company-documents/lib/company-documents-api"
import {
  CompanyDocument,
  CreateCompanyDocumentPayload,
} from "@/modules/company-documents/types/company-document"
import {
  ArrowLeft,
  FileText,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Paperclip,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Bell,
  HardDrive,
  User,
} from "lucide-react"
import { DocumentPreviewModal } from "@/modules/core/components/document-preview-modal"

export default function CompanyDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.id as string

  const [document, setDocument] = useState<CompanyDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [formData, setFormData] = useState<CreateCompanyDocumentPayload>({
    documentName: "",
    isPrivate: false,
    issueDate: "",
    expiryDate: "",
    reminderBeforeExpiry: 30,
    notes: "",
    attachment: null,
  })

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchDocumentDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await companyDocumentsApi.getCompanyDocumentById(docId)
      setDocument(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load document details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (docId) {
      fetchDocumentDetail()
    }
  }, [docId])

  const handleOpenEdit = () => {
    if (!document) return
    setFormData({
      documentName: document.documentName,
      isPrivate: Boolean(document.isPrivate),
      issueDate: document.issueDate || "",
      expiryDate: document.expiryDate || "",
      reminderBeforeExpiry: document.reminderBeforeExpiry ?? 30,
      notes: document.notes || "",
      attachment: null,
    })
    setIsEditOpen(true)
  }

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!document) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await companyDocumentsApi.updateCompanyDocument(document.id, formData)
      setDocument((prev) => (prev ? { ...prev, ...res.data } : res.data))
      showNotification("Document updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update document.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!document) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      await companyDocumentsApi.deleteCompanyDocument(document.id)
      router.push("/company-documents")
    } catch (err: any) {
      setError(err.message || "Failed to delete document.")
      setIsSubmittingDelete(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading document profile...</span>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Document Not Found"
          description={`Company document record #${docId} does not exist.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/company-documents">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Company Documents
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const fileUrl = document.attachmentUrl || document.media?.url
  const mediaObj = document.media

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={document.documentName}
        description={`Legal Certificate & Compliance Record (ID: #${document.id})`}
        badge={
          document.isPrivate ? (
            <Badge variant="destructive" className="gap-1 font-mono">
              <Lock className="h-3 w-3" /> Private Document
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 font-mono">
              <Unlock className="h-3 w-3" /> Public Access
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/company-documents">
                <ArrowLeft className="h-4 w-4" /> Back to Directory
              </Link>
            </Button>
            <Button onClick={handleOpenEdit} variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Edit Document
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

      {/* Main Grid Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Document Metadata */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Document Details & Expiry Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Document Name</span>
              <span className="font-bold text-foreground">{document.documentName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" /> Issue Date
              </span>
              <span className="font-semibold text-foreground font-mono">{document.issueDate || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" /> Expiry Date
              </span>
              <span className="font-bold text-foreground font-mono">{document.expiryDate || "No Expiry Date"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Bell className="h-3 w-3 text-primary" /> Expiry Alert Threshold
              </span>
              <span className="font-semibold text-foreground">
                {document.reminderBeforeExpiry !== undefined && document.reminderBeforeExpiry !== null
                  ? `${document.reminderBeforeExpiry} days before expiry`
                  : "Not set"}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" /> Created By User
              </span>
              <span className="font-semibold text-foreground">User #{document.createdBy || "System"}</span>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-medium block">Document Notes</span>
              <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                {document.notes || "No internal notes provided for this document."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Attachment Media Preview */}
        <Card className="border border-border/60 flex flex-col">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-emerald-500" /> Spatie Media Attachment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
            {fileUrl ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="font-bold text-foreground text-xs block truncate">
                        {mediaObj?.file_name || "Attachment File"}
                      </span>
                      {mediaObj?.size && (
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {(mediaObj.size / 1024).toFixed(1)} KB — {mediaObj.mime_type}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                    <Button size="sm" variant="default" onClick={() => setIsPreviewOpen(true)} className="gap-1.5 flex-1 text-xs">
                      <ExternalLink className="h-3.5 w-3.5" /> View / Preview Attachment
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                      <a href={fileUrl} download>
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                    <HardDrive className="h-3 w-3 text-primary" /> Spatie Media Object Metadata
                  </span>
                  <div className="font-mono text-[10px] text-muted-foreground space-y-0.5 pt-1">
                    <div>Media ID: {document.attachmentMediaId || mediaObj?.id}</div>
                    <div>MIME Type: {mediaObj?.mime_type || "N/A"}</div>
                    <div>Stored URL: {fileUrl}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground space-y-3">
                <Paperclip className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <p className="font-semibold text-foreground">No file attached to this document record.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Click "Edit Document" above to upload a file.</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleOpenEdit} className="gap-1.5 mt-2 text-xs">
                  <Paperclip className="h-3.5 w-3.5" /> Upload Attachment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal 1: Edit Document */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Company Document" maxWidth="lg">
        <form onSubmit={handleUpdateDocument} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Document Name *</label>
            <Input
              value={formData.documentName}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentName: e.target.value }))}
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
                id="editIsPrivateCheck"
                checked={Boolean(formData.isPrivate)}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPrivate: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="editIsPrivateCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                Mark as Private / Restricted Document
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes / Internal Context</label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Attachment Upload Field */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" /> Replace Attachment File
              </label>
              {fileUrl && <span className="text-[11px] text-emerald-500 font-medium">File currently attached</span>}
            </div>

            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setFormData((prev) => ({ ...prev, attachment: file }))
              }}
              className="text-xs cursor-pointer"
            />

            <p className="text-[11px] text-amber-500 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Uploading a new file replaces the existing attachment in Spatie Media.</span>
            </p>
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
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Company Document">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete document record{" "}
            <strong className="text-foreground font-semibold">"{document.documentName}"</strong>? This will permanently erase the document record and file.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Document
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal 3: Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={{
          isPrivate: Boolean(document.isPrivate),
          attachmentUrl: fileUrl,
          documentName: document.documentName,
          mimeType: mediaObj?.mime_type,
        }}
      />
    </div>
  )
}
