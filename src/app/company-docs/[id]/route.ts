import { NextRequest } from "next/server"

function getBackendMediaUrl(id: string): { backendUrl: string; rawBase: string } {
  const rawBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  let cleanBase = rawBase.trim().replace(/\/+$/, "")
  if (cleanBase.endsWith("/api")) {
    cleanBase = cleanBase.slice(0, -4)
  }
  return {
    backendUrl: `${cleanBase}/api/media/private/${id}`,
    rawBase,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Extract token from query param ?token=, auth_token cookie, or Authorization header
  const searchParams = request.nextUrl.searchParams
  let token =
    searchParams.get("token") ||
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("erp_auth_token")?.value

  if (!token) {
    const authHeader = request.headers.get("Authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }
  }

  const { backendUrl, rawBase } = getBackendMediaUrl(id)

  console.log('[COMPANY-DOCS] Media ID:', id)
  console.log('[COMPANY-DOCS] API_URL:', process.env.API_URL || "Not Set (using default)")
  console.log('[COMPANY-DOCS] Raw API Base:', rawBase)
  console.log('[COMPANY-DOCS] Backend URL:', backendUrl)
  console.log('[COMPANY-DOCS] Token exists:', !!token)

  if (!token) {
    console.warn(`[COMPANY-DOCS] No auth token present. Redirecting to /login`)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // Prevent Next.js from caching private per-user documents
    })

    console.log(`[COMPANY-DOCS] Backend response status: ${response.status} ${response.statusText}`)

    // If Laravel returned non-2xx status (401, 403, 404, etc.), forward status and JSON body straight through
    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[COMPANY-DOCS] Backend returned error status ${response.status}:`, errorText)

      return new Response(errorText, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
      })
    }

    console.log(`[COMPANY-DOCS] Successfully streaming document file (${response.headers.get("Content-Type")}, ${response.headers.get("Content-Length") || "unknown"} bytes)`)

    // Stream ReadableStream response body straight through with file headers
    const headers: Record<string, string> = {
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": response.headers.get("Content-Disposition") || "inline",
      "Cache-Control": response.headers.get("Cache-Control") || "no-cache, private, must-revalidate",
    }

    const contentLength = response.headers.get("Content-Length")
    if (contentLength) {
      headers["Content-Length"] = contentLength
    }

    return new Response(response.body, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error(`[COMPANY-DOCS] Exception during server fetch:`, error)
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Failed to proxy document request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

