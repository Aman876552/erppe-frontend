"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { leadsApi } from "@/modules/leads/lib/leads-api"
import { Lead } from "@/modules/leads/types/lead"
import {
  Target,
  Plus,
  RefreshCw,
  Search,
  Building2,
  Phone,
  Mail,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Tag,
  TrendingUp,
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedPriority, setSelectedPriority] = useState<string>("all")

  // Delete modal state
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await leadsApi.getLeads()
      setLeads(res.data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load leads.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (selectedStatus !== "all" && String(lead.status).toLowerCase() !== selectedStatus.toLowerCase()) {
        return false
      }
      if (selectedPriority !== "all" && String(lead.leadPriority).toLowerCase() !== selectedPriority.toLowerCase()) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = (lead.leadName || "").toLowerCase().includes(q)
        const matchCode = (lead.leadCode || "").toLowerCase().includes(q)
        const matchCompany = (lead.company || "").toLowerCase().includes(q)
        const matchContact = (lead.name || lead.contactPerson || "").toLowerCase().includes(q)
        const matchPhone = (lead.phone || "").toLowerCase().includes(q)
        const matchEmail = (lead.email || "").toLowerCase().includes(q)
        const matchAssigned = (lead.assignedTo || "").toLowerCase().includes(q)

        return matchName || matchCode || matchCompany || matchContact || matchPhone || matchEmail || matchAssigned
      }

      return true
    })
  }, [leads, selectedStatus, selectedPriority, searchQuery])

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return
    setIsSubmittingDelete(true)
    try {
      await leadsApi.deleteLead(deletingLead.id)
      showNotification(`Lead "${deletingLead.leadName}" deleted successfully.`)
      setDeletingLead(null)
      loadData()
    } catch (err: any) {
      setError(err.message || "Failed to delete lead.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Metrics
  const totalEstPriceSum = leads.reduce((sum, l) => sum + Number(l.estPrice || 0), 0)
  const newCount = leads.filter((l) => String(l.status).toLowerCase() === "new").length
  const qualifiedCount = leads.filter((l) =>
    ["qualified", "in progress"].includes(String(l.status).toLowerCase())
  ).length
  const convertedCount = leads.filter((l) =>
    ["converted", "closed won"].includes(String(l.status).toLowerCase())
  ).length

  // Columns for DataTable
  const columns: Column<Lead>[] = [
    {
      key: "leadName",
      title: "Lead / Enquiry",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <Link
              href={`/leads/${row.id}`}
              className="font-extrabold text-foreground hover:text-primary transition-colors text-xs block truncate max-w-[220px]"
            >
              {row.leadName}
            </Link>
            {row.leadCode && (
              <span className="text-[10px] text-muted-foreground font-mono block">
                Code: {row.leadCode}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "company",
      title: "Customer & Contact",
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-foreground block truncate max-w-[160px]">
            {row.company || row.name || "—"}
          </span>
          {(row.name || row.contactPerson) && (
            <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">
              👤 {row.contactPerson || row.name} {row.role ? `(${row.role})` : ""}
            </span>
          )}
          {row.phone && (
            <span className="text-[10px] text-muted-foreground block">
              📞 {row.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "leadType",
      title: "Type & Source",
      render: (row) => (
        <div className="space-y-0.5 text-[11px]">
          <span className="font-semibold text-foreground block">
            {row.leadType || "Product"}
          </span>
          {row.leadSource && (
            <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
              <Tag className="h-2.5 w-2.5" /> {row.leadSource}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "leadPriority",
      title: "Priority",
      render: (row) => (
        <Badge variant={priorityVariant(row.leadPriority)} className="text-[10px] font-bold">
          {row.leadPriority || "Medium"}
        </Badge>
      ),
    },
    {
      key: "estPrice",
      title: "Est. Price",
      render: (row) => (
        <span className="text-xs font-mono font-bold text-foreground block">
          {money(row.estPrice)}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <Badge variant={statusVariant(row.status)} className="text-[10px] font-bold">
          {row.status || "New"}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      title: "Assigned To",
      render: (row) =>
        row.assignedTo ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[130px]">{row.assignedTo}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">— Unassigned —</span>
        ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Lead Details">
            <Link href={`/leads/${row.id}`}>
              <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit Lead">
            <Link href={`/leads/${row.id}?edit=true`}>
              <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingLead(row)}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            title="Delete Lead"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leads & Sales Enquiries"
        description="Track incoming enquiries, qualification stages, customer budgets, and pipeline conversions."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/leads/new">
                <Plus className="h-3.5 w-3.5" /> New Lead
              </Link>
            </Button>
          </div>
        }
      />

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Leads</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{leads.length}</span>
            <span className="text-[11px] text-muted-foreground font-medium">all time</span>
          </div>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">New / Unqualified</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{newCount}</span>
            <span className="text-[11px] text-blue-500 font-semibold">new leads</span>
          </div>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Qualified / In Progress</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{qualifiedCount}</span>
            <span className="text-[11px] text-amber-500 font-semibold">in pipeline</span>
          </div>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Est. Pipeline Value</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-foreground">{money(totalEstPriceSum)}</span>
          </div>
        </Card>
      </div>

      {/* Table Filters & Toolbar */}
      <Card className="p-4 border border-border/60 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by lead name, company, contact, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 py-1 text-xs rounded-md border border-input bg-background font-medium text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 px-3 py-1 text-xs rounded-md border border-input bg-background font-medium text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* DataTable */}
        <DataTable<Lead>
          columns={columns}
          data={filteredLeads}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deletingLead)}
        onClose={() => setDeletingLead(null)}
        title="Delete Lead"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Are you sure you want to delete lead <strong className="text-foreground">{deletingLead?.leadName}</strong>? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingLead(null)}
              disabled={isSubmittingDelete}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isSubmittingDelete}
              className="gap-1.5"
            >
              {isSubmittingDelete ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete Lead
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
