"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { leadsApi } from "@/modules/leads/lib/leads-api"
import { Lead } from "@/modules/leads/types/lead"
import { LeadForm } from "@/modules/leads/components/lead-form"
import {
  ArrowLeft,
  Target,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  UserCheck,
  Tag,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  PackageCheck,
  FileText,
} from "lucide-react"

function money(n: number | null | undefined) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`
}

function priorityVariant(priority: string | null | undefined): "destructive" | "warning" | "secondary" | "outline" {
  const p = String(priority || "").toLowerCase()
  if (p === "high") return "destructive"
  if (p === "medium") return "warning"
  return "secondary"
}

function statusVariant(status: string | null | undefined): "default" | "secondary" | "outline" | "success" | "destructive" | "warning" {
  const st = String(status || "").toLowerCase()
  if (st === "converted" || st === "closed won") return "success"
  if (st === "qualified") return "default"
  if (st === "in progress") return "warning"
  if (st === "lost" || st === "closed lost") return "destructive"
  return "outline"
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const isEditingParam = searchParams?.get("edit") === "true"

  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(isEditingParam)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadLead = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await leadsApi.getLeadById(id)
      setLead(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load lead details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadLead()
  }, [id])

  useEffect(() => {
    if (isEditingParam) setIsEditing(true)
  }, [isEditingParam])

  const handleDelete = async () => {
    if (!lead) return
    if (!confirm(`Delete lead "${lead.leadName}"? This action cannot be undone.`)) return
    setIsDeleting(true)
    try {
      await leadsApi.deleteLead(lead.id)
      router.push("/leads")
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to delete lead")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading Lead Details...</p>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/leads">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Leads
          </Link>
        </Button>
        <Card className="p-6 text-center border-red-500/30 bg-red-500/10 text-red-500 space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
          <h3 className="font-bold text-sm">Lead Not Found</h3>
          <p className="text-xs text-muted-foreground">{error || "The requested lead does not exist."}</p>
        </Card>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Edit Lead: {lead.leadName}</h1>
              <p className="text-xs text-muted-foreground">Update status, contact details, or assigned owner.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel Edit
          </Button>
        </div>

        <LeadForm initial={lead as any} leadId={String(lead.id)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
            <Link href="/leads">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-foreground">{lead.leadName}</h2>
              <Badge variant={statusVariant(lead.status)} className="font-bold text-xs">
                {lead.status || "New"}
              </Badge>
              <Badge variant={priorityVariant(lead.leadPriority)} className="text-xs">
                {lead.leadPriority || "Medium"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lead.company ? `Company: ${lead.company}` : ""}
              {(lead.contactPerson || lead.name) ? ` · Contact: ${lead.contactPerson || lead.name}` : ""}
              {lead.leadCode ? ` · Code: ${lead.leadCode}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-1.5 text-xs">
            <Edit className="h-3.5 w-3.5" /> Edit Lead
          </Button>

          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-1.5 text-xs">
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card className="p-5 border border-border/60 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2.5">
              <Target className="h-4 w-4 text-primary" /> Enquiry Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Est. Deal Price
                </span>
                <div className="text-xl font-extrabold text-foreground font-mono">{money(lead.estPrice)}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Lead Type &amp; Priority
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-semibold">
                    {lead.leadType || "Product"}
                  </Badge>
                  <Badge variant={priorityVariant(lead.leadPriority)} className="text-xs">
                    {lead.leadPriority || "Medium"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Lead Source
                </span>
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {lead.leadSource || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Delivery Timeline
                </span>
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  {lead.delivery || "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Product Items */}
          {Array.isArray(lead.items) && lead.items.length > 0 && (
            <Card className="p-5 border border-border/60 space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <PackageCheck className="h-4 w-4 text-primary" /> Products Enquired
              </h3>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground font-bold">
                    <tr>
                      <th className="p-2.5">Product Name</th>
                      <th className="p-2.5">Code / SKU</th>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lead.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-foreground">{item.productName}</td>
                        <td className="p-2.5 text-muted-foreground font-mono">{item.productCode || "—"}</td>
                        <td className="p-2.5 text-muted-foreground">{item.department || "—"}</td>
                        <td className="p-2.5 text-right font-bold">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Notes */}
          {lead.notes && (
            <Card className="p-5 border border-border/60 space-y-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <FileText className="h-4 w-4 text-primary" /> Meeting Notes &amp; Requirements
              </h3>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
            </Card>
          )}
        </div>

        {/* Right 1 column */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card className="p-5 border border-border/60 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <Building2 className="h-4 w-4 text-primary" /> Customer Contact
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-extrabold text-foreground block text-sm">
                  {lead.company || lead.name || "Customer Unspecified"}
                </span>
                {(lead.contactPerson || lead.name) && (
                  <span className="text-xs text-muted-foreground block font-medium">
                    Contact: {lead.contactPerson || lead.name} {lead.role ? `(${lead.role})` : ""}
                  </span>
                )}
              </div>

              {lead.phone && (
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" /> {lead.phone}
                </div>
              )}

              {lead.whatsapp && (
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold text-xs">WA:</span> {lead.whatsapp}
                </div>
              )}

              {lead.email && (
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" /> {lead.email}
                </div>
              )}

              {(lead.address || lead.city || lead.state) && (
                <div className="pt-2 border-t border-border/50 text-muted-foreground flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    {[lead.address, lead.city, lead.state, lead.pincode].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Assigned Owner */}
          <Card className="p-5 border border-border/60 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <UserCheck className="h-4 w-4 text-primary" /> Assigned Owner
            </h3>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-foreground block">
                {lead.assignedTo || "— Unassigned —"}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
