"use client"

import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuthStore } from "@/modules/core/stores/auth-store"
import { useThemeStore } from "@/modules/core/stores/theme-store"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  React.useEffect(() => {
    useAuthStore.getState().initialize()
    const theme = useThemeStore.getState().theme
    useThemeStore.getState().setTheme(theme)
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
