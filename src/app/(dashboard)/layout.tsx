"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/modules/core/layout/app-sidebar"
import { AppHeader } from "@/modules/core/layout/app-header"
import { MobileSidebar } from "@/modules/core/layout/mobile-sidebar"
import { useAuth } from "@/modules/core/hooks/use-auth"
import { LoadingSpinner } from "@/modules/core/components/loading-spinner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Authenticating session..." size="lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      {/* Desktop Navigation Sidebar */}
      <AppSidebar />

      {/* Mobile Slide-over Sidebar Drawer */}
      <MobileSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  )
}
