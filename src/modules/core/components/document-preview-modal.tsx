"use client"

import React from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePrivateMediaUrl } from "../hooks/use-private-media-url"
import { MediaDocumentRef } from "../lib/media"
import {
  FileText,
  Lock,
  Unlock,
  Download,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Paperclip,
  ShieldAlert,
} from "lucide-react"

export interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: MediaDocumentRef | null
}

export function DocumentPreviewModal({ isOpen, onClose, document }: DocumentPreviewModalProps) {
  const { url, isLoading, error, isPrivateBlob } = usePrivateMediaUrl(isOpen ? document : null)

  if (!document) return null

  const documentName = document.documentName || "Document Attachment"
  const isPrivate = Boolean(document.isPrivate)
  const mimeType = document.mimeType || ""
  const isImage = mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(documentName)
  const isPdf = mimeType.includes("pdf") || /\.pdf$/i.test(documentName)

  return (
    <Dialog open={isOpen} onClose={onClose} title={documentName} maxWidth="2xl">
      <div className="space-y-4 mt-2">
        {/* Header Badges */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs">
          <div className="flex items-center gap-2">
            {isPrivate ? (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <Lock className="h-3 w-3" /> Private Document (Authenticated Blob)
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Unlock className="h-3 w-3" /> Public Document
              </Badge>
            )}
            {mimeType && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {mimeType}
              </Badge>
            )}
          </div>

          {url && (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" /> Open PDF in New Tab
                </a>
              </Button>
              <Button asChild size="sm" variant="default" className="gap-1.5 text-xs">
                <a href={url} download={documentName}>
                  <Download className="h-3.5 w-3.5" /> Download File
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Media Preview Container */}
        <div className="min-h-[300px] max-h-[500px] flex items-center justify-center rounded-xl border border-border/60 bg-muted/20 p-4 overflow-auto">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Fetching authenticated private media blob...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 text-center py-10 space-y-2 max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Access Restricted</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {error.includes("403")
                    ? "You do not have permission to view or download this private file."
                    : error.includes("404")
                    ? "The requested private document attachment was not found on the server."
                    : error}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && url && (
            <div className="w-full flex justify-center">
              {isImage ? (
                <img
                  src={url}
                  alt={documentName}
                  className="max-h-[440px] w-auto max-w-full rounded-lg object-contain shadow-sm border border-border/40"
                />
              ) : isPdf ? (
                <iframe
                  src={url}
                  title={documentName}
                  className="w-full h-[450px] rounded-lg border border-border/40 bg-background"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground space-y-3">
                  <Paperclip className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-bold text-foreground text-sm">{documentName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Direct browser preview is not supported for this file format. Click download below to save the file.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="default" className="gap-1.5 mt-2 text-xs">
                    <a href={url} download={documentName}>
                      <Download className="h-3.5 w-3.5" /> Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
