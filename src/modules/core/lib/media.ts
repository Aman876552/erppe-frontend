import { authStorage } from "./auth"

export interface MediaDocumentRef {
  isPrivate?: boolean
  attachmentUrl?: string | null
  documentName?: string
  mimeType?: string
}

/**
 * Fetches a private media file using Bearer authentication header
 * and converts it into a local object URL (blob:http://...).
 */
export async function fetchPrivateMediaUrl(mediaUrl: string): Promise<string> {
  const token = authStorage.getAccessToken()
  const headers: Record<string, string> = {
    Accept: "*/*",
  }

  if (token && token.trim().length > 0 && token !== "undefined" && token !== "null") {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(mediaUrl, {
    method: "GET",
    headers,
  })

  if (res.status === 403) {
    throw new Error("403: You do not have permission to access this private document.")
  }

  if (res.status === 404) {
    throw new Error("404: Private media file was not found on server.")
  }

  if (!res.ok) {
    throw new Error(`Failed to load private media: ${res.status} ${res.statusText}`)
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/**
 * Resolves the display URL for a document.
 * - Public documents (isPrivate: false) return attachmentUrl directly.
 * - Private documents (isPrivate: true) fetch with Bearer token & convert to blob URL.
 */
export async function getDisplayUrl(doc: MediaDocumentRef): Promise<string | null> {
  if (!doc.attachmentUrl) return null

  // Public docs: use URL as-is, no auth needed
  if (!doc.isPrivate) {
    return doc.attachmentUrl
  }

  // Private docs: fetch with auth, return blob URL
  return await fetchPrivateMediaUrl(doc.attachmentUrl)
}

/**
 * Safely revokes a blob object URL to prevent browser memory leaks.
 */
export function revokeMediaUrl(objectUrl: string | null | undefined): void {
  if (objectUrl && objectUrl.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      console.warn("Failed to revoke object URL:", err)
    }
  }
}

/**
 * Opens a document attachment in a new browser tab.
 * For private media, fetches with Bearer auth token and opens the blob URL.
 */
export async function openMediaInNewTab(doc: MediaDocumentRef): Promise<void> {
  if (!doc.attachmentUrl) return

  if (!doc.isPrivate) {
    window.open(doc.attachmentUrl, "_blank", "noopener,noreferrer")
    return
  }

  // Synchronously open tab first to bypass browser popup blockers
  const newTab = window.open("about:blank", "_blank")
  try {
    const blobUrl = await fetchPrivateMediaUrl(doc.attachmentUrl)
    if (newTab) {
      newTab.location.href = blobUrl
    }
  } catch (err: any) {
    if (newTab) {
      newTab.document.write(
        `<div style="font-family:system-ui,-apple-system,sans-serif;padding:30px;max-width:500px;margin:50px auto;border:1px solid #f87171;background:#fef2f2;border-radius:12px;color:#991b1b;">
          <h3 style="margin-top:0;">Access Restricted</h3>
          <p style="font-size:14px;line-height:1.5;">${err.message || "Failed to load private document."}</p>
        </div>`
      )
    }
  }
}
