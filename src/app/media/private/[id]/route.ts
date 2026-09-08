import { NextRequest, NextResponse } from "next/server"

function getBackendMediaUrl(id: string): string {
  const rawBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  let cleanBase = rawBase.trim().replace(/\/+$/, "")
  if (cleanBase.endsWith("/api")) {
    cleanBase = cleanBase.slice(0, -4)
  }
  return `${cleanBase}/api/media/private/${id}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Extract token from query param ?token=, auth_token cookie, or Authorization header
  const searchParams = request.nextUrl.searchParams
  let token = searchParams.get("token") || request.cookies.get("auth_token")?.value || request.cookies.get("erp_auth_token")?.value

  if (!token) {
    const authHeader = request.headers.get("Authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const backendUrl = getBackendMediaUrl(id)


  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (!response.ok) {
      return new Response("Unable to load private document", {
        status: response.status,
      })
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition":
          response.headers.get("Content-Disposition") || "inline",
        "Cache-Control":
          response.headers.get("Cache-Control") || "no-cache, must-revalidate",
      },
    })
  } catch (error: any) {
    return new Response(error.message || "Failed to fetch private document", {
      status: 500,
    })
  }
}
