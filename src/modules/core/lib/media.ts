import { authStorage } from "./auth"

export interface MediaDocumentRef {
  id?: string | number
  isPrivate?: boolean
  attachmentUrl?: string | null
  attachmentMediaId?: string | number | null
  documentName?: string
  mimeType?: string
  media?: {
    id?: string | number
    file_name?: string
    mime_type?: string
    url?: string
  } | null
}

/**
 * Extracts Spatie Media ID from any reference string or MediaDocumentRef object
 */
export function extractMediaId(docOrUrl?: MediaDocumentRef | string | null): string | null {
  if (!docOrUrl) return null

  if (typeof docOrUrl === "object") {
    if (docOrUrl.attachmentMediaId) return String(docOrUrl.attachmentMediaId)
    if (docOrUrl.media?.id) return String(docOrUrl.media.id)
    if (docOrUrl.attachmentUrl) return extractMediaId(docOrUrl.attachmentUrl)
    return null
  }

  const match = docOrUrl.match(/\/(?:media\/private|company-documents|company-docs)\/([^\/\?]+)/)
  if (match && match[1]) return match[1]

  if (!docOrUrl.includes("/") && !docOrUrl.includes("http")) {
    return docOrUrl
  }

  return null
}

/**
 * Transforms an attachment URL into the clean Next.js server route (/company-docs/{id})
 */
export function getProxyMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const docId = extractMediaId(url)
  return docId ? `/company-docs/${docId}` : url
}

/**
 * Client-side helper: Opens document directly via Next.js proxy route URL in a new browser tab.
 * Uses auth_token cookie for authentication to maintain clean, query-less URLs (/company-docs/{id}).
 */
export function openCompanyDocument(docOrUrl: MediaDocumentRef | string): void {
  const mediaId = extractMediaId(docOrUrl)
  const rawUrl = typeof docOrUrl === "string" ? docOrUrl : docOrUrl?.attachmentUrl

  if (!mediaId && !rawUrl) {
    console.warn(`[OPEN COMPANY DOCUMENT] No media ID or attachment URL present on document.`)
    alert("No file is attached to this document record.")
    return
  }

  // Sync token to document.cookie so Next.js server route receives it automatically without ?token= in URL
  const token = authStorage.getAccessToken()
  if (token && typeof document !== "undefined") {
    document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
    document.cookie = `erp_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
  }

  const proxyPath = mediaId ? `/company-docs/${mediaId}` : rawUrl!

  console.log(`[OPEN COMPANY DOCUMENT] Opening clean Next.js proxy URL in new tab: "${proxyPath}"`)
  window.open(proxyPath, "_blank")
}



/**
 * Backward compatibility alias for openCompanyDocument
 */
export const openMediaInNewTab = openCompanyDocument

export async function fetchPrivateMediaUrl(mediaUrl: string): Promise<string> {
  const mediaId = extractMediaId(mediaUrl)
  const token = authStorage.getAccessToken()
  const proxyUrl = mediaId ? `/company-docs/${mediaId}` : mediaUrl

  const headers: Record<string, string> = { Accept: "*/*" }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(proxyUrl, { method: "GET", headers, cache: "no-store" })
  if (!res.ok) throw new Error(`Failed to load document: ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function getDisplayUrl(doc: MediaDocumentRef): Promise<string | null> {
  const mediaId = extractMediaId(doc)
  return mediaId ? `/company-docs/${mediaId}` : doc.attachmentUrl || null
}

export function revokeMediaUrl(objectUrl: string | null | undefined): void {
  if (objectUrl && objectUrl.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.warn("Failed to revoke object URL:", err)
    }
  }
}
