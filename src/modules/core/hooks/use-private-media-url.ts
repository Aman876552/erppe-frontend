import { useState, useEffect } from "react"
import { fetchPrivateMediaUrl, MediaDocumentRef } from "../lib/media"

export interface UsePrivateMediaUrlResult {
  url: string | null
  isLoading: boolean
  error: string | null
  isPrivateBlob: boolean
}

export function usePrivateMediaUrl(doc?: MediaDocumentRef | null): UsePrivateMediaUrlResult {
  const [url, setUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isPrivateBlob, setIsPrivateBlob] = useState<boolean>(false)

  const attachmentUrl = doc?.attachmentUrl
  const isPrivate = Boolean(doc?.isPrivate)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    if (!attachmentUrl) {
      setUrl(null)
      setIsLoading(false)
      setError(null)
      setIsPrivateBlob(false)
      return
    }

    // Public Document: return attachmentUrl as static URL
    if (!isPrivate) {
      setUrl(attachmentUrl)
      setIsLoading(false)
      setError(null)
      setIsPrivateBlob(false)
      return
    }

    // Private Document: fetch with Bearer header & convert to blob URL
    setIsLoading(true)
    setError(null)
    setIsPrivateBlob(true)

    ;(async () => {
      try {
        const resolved = await fetchPrivateMediaUrl(attachmentUrl)
        objectUrl = resolved
        if (!cancelled) {
          setUrl(resolved)
          setError(null)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load private media document.")
          setUrl(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch {
          // Ignore revocation errors on cleanup
        }
      }
    }
  }, [attachmentUrl, isPrivate])

  return { url, isLoading, error, isPrivateBlob }
}
