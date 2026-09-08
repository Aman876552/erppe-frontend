"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LeadForm } from "@/modules/leads/components/lead-form"

export default function NewLeadPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">New Lead / Sales Enquiry</h1>
          <p className="text-xs text-muted-foreground">Capture potential customer requirements, products, and initial estimated value.</p>
        </div>
      </div>

      <LeadForm />
    </div>
  )
}
