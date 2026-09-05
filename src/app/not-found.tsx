import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404</h1>
      <h2 className="mt-2 text-xl font-bold text-foreground">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The route or resource you requested could not be located in the system.
      </p>
      <Button asChild className="mt-6 gap-2" variant="default">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </div>
  )
}
