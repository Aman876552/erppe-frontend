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
import { ordersApi } from "@/modules/orders/lib/orders-api"
import { clientsApi } from "@/modules/clients/lib/clients-api"
import { usersApi, User } from "@/modules/core/lib/users-api"
import { Client } from "@/modules/clients/types/client"
import { Order, ORDER_STATUSES, OrderStatus } from "@/modules/orders/types/order"
import { OrderFormModal } from "@/modules/orders/components/order-form-modal"
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  Building2,
  UserCheck,
  FileCheck,
  Package,
} from "lucide-react"

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "success" | "destructive" | "warning" {
  const st = String(status || "").toLowerCase()
  if (st === "completed") return "success"
  if (st === "confirmed") return "default"
  if (st === "in production") return "warning"
  if (st === "dispatched") return "secondary"
  if (st === "cancelled") return "destructive"
  return "outline"
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<string>("all")
  const [selectedManager, setSelectedManager] = useState<string>("all")

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Client lookup map for fast client name rendering
  const clientsMap = useMemo(() => {
    const map = new Map<string, Client>()
    clients.forEach((c) => {
      map.set(String(c.id), c)
    })
    return map
  }, [clients])

  // User lookup map for assigned manager rendering
  const usersMap = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((u) => {
      map.set(String(u.id), u)
    })
    return map
  }, [users])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [ordersRes, clientsRes, usersRes] = await Promise.all([
        ordersApi.getOrders(),
        clientsApi.getClients(),
        usersApi.getUsers(),
      ])

      setOrders(ordersRes.data || [])
      setClients(clientsRes.data || [])
      setUsers(usersRes.data || [])
    } catch (err: any) {
      setError(err.message || "Failed to load customer orders.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status Filter
      if (selectedStatus !== "all" && String(order.status).toLowerCase() !== selectedStatus.toLowerCase()) {
        return false
      }
      // Client Filter
      if (selectedClient !== "all" && String(order.clientId) !== selectedClient) {
        return false
      }
      // Manager Filter
      if (selectedManager !== "all" && String(order.orderManagerId) !== selectedManager) {
        return false
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const client = clientsMap.get(String(order.clientId))
        const clientName = client ? client.name.toLowerCase() : ""
        const managerUser = order.orderManagerId ? usersMap.get(String(order.orderManagerId)) : null
        const managerName = (
          order.assignedManager ||
          managerUser?.name ||
          (order as any).orderManager?.name ||
          (order as any).order_manager?.name ||
          ""
        ).toLowerCase()
        const matchOrderNo = order.orderNo.toLowerCase().includes(q)
        const matchPoRef = (order.clientPoRef || "").toLowerCase().includes(q)
        const matchManager = managerName.includes(q)
        const matchNotes = (order.notes || "").toLowerCase().includes(q)
        const matchClient = clientName.includes(q)

        return matchOrderNo || matchPoRef || matchManager || matchNotes || matchClient
      }

      return true
    })
  }, [orders, selectedStatus, selectedClient, selectedManager, searchQuery, clientsMap, usersMap])

  // Handlers
  const handleOpenCreate = () => {
    setEditingOrder(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order)
    setIsModalOpen(true)
  }

  const handleToggleFreeze = async (order: Order) => {
    const isFrozen = Boolean(order.frozenAt)
    const newFrozenAt = isFrozen ? null : new Date().toISOString()
    try {
      await ordersApi.updateOrder(order.id, { frozenAt: newFrozenAt })
      showNotification(
        isFrozen
          ? `Order "${order.orderNo}" unlocked for editing.`
          : `Order "${order.orderNo}" locked/frozen successfully.`
      )
      loadData()
    } catch (err: any) {
      setError(err.message || "Failed to update order freeze status.")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return
    setIsSubmittingDelete(true)
    try {
      await ordersApi.deleteOrder(deletingOrder.id)
      showNotification(`Order "${deletingOrder.orderNo}" deleted.`)
      setDeletingOrder(null)
      loadData()
    } catch (err: any) {
      setError(err.message || "Failed to delete order.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Metrics
  const totalAmountSum = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  const draftCount = orders.filter((o) => String(o.status).toLowerCase() === "draft").length
  const activeCount = orders.filter((o) =>
    ["confirmed", "in production"].includes(String(o.status).toLowerCase())
  ).length
  const completedCount = orders.filter((o) =>
    ["dispatched", "completed"].includes(String(o.status).toLowerCase())
  ).length

  // Columns for DataTable
  const columns: Column<Order>[] = [
    {
      key: "orderNo",
      title: "Order Details",
      render: (row) => {
        const client = clientsMap.get(String(row.clientId))
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/orders/${row.id}`}
                  className="font-extrabold text-foreground hover:text-primary transition-colors text-xs font-mono"
                >
                  {row.orderNo}
                </Link>
                {row.frozenAt && (
                  <Badge variant="outline" className="text-[9px] gap-0.5 border-amber-500/30 text-amber-600 bg-amber-500/10 px-1 py-0">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </Badge>
                )}
              </div>
              {row.clientPoRef ? (
                <span className="text-[10px] text-muted-foreground block font-medium mt-0.5">
                  PO: {row.clientPoRef}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground block italic">No PO Reference</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: "clientId",
      title: "Client",
      render: (row) => {
        const client = clientsMap.get(String(row.clientId))
        return (
          <div className="space-y-0.5 text-xs">
            <span className="font-bold text-foreground block truncate max-w-[160px]">
              {client ? client.name : `Client #${row.clientId}`}
            </span>
            {client?.clientCode && (
              <span className="text-[10px] text-muted-foreground font-mono block">
                Code: {client.clientCode}
              </span>
            )}
            {row.clientLocation?.locationName && (
              <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">
                📍 {row.clientLocation.locationName}
                {row.clientLocation.city ? ` (${row.clientLocation.city})` : ""}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "orderDate",
      title: "Timeline & Dates",
      render: (row) => (
        <div className="space-y-0.5 text-[11px]">
          <span className="font-mono text-foreground block flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" /> {row.orderDate || "—"}
          </span>
          {row.overallDeadline && (
            <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 text-amber-500" /> Due: {row.overallDeadline}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "assignedManager",
      title: "Assigned Manager",
      render: (row) => {
        const userObj = row.orderManagerId ? usersMap.get(String(row.orderManagerId)) : null
        const managerName =
          row.assignedManager ||
          userObj?.name ||
          (row as any).orderManager?.name ||
          (row as any).order_manager?.name ||
          null

        return managerName ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[140px]">{managerName}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">— Unassigned —</span>
        )
      },
    },
    {
      key: "totalAmount",
      title: "Total Amount",
      render: (row) => (
        <span className="text-xs font-mono font-bold text-foreground block">
          {money(row.totalAmount)}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => (
        <Badge variant={statusVariant(row.status)} className="gap-1 text-[10px] font-bold">
          {row.status || "Draft"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Order Details">
            <Link href={`/orders/${row.id}`}>
              <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="h-7 w-7 p-0"
            title="Edit Order"
          >
            <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleFreeze(row)}
            className={`h-7 w-7 p-0 ${
              row.frozenAt ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"
            }`}
            title={row.frozenAt ? "Unlock Order" : "Lock Order"}
          >
            {row.frozenAt ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingOrder(row)}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            title="Delete Order"
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
        title="Customer Orders"
        description="Manage customer sales orders, PO references, commercial terms, and production status."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/orders/new">
                <Plus className="h-3.5 w-3.5" /> New Customer Order
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

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Customer Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{orders.length}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block font-mono">
            {money(totalAmountSum)} total order value
          </span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Draft Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{draftCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Awaiting confirmation</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active / In Production</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{activeCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Confirmed &amp; in-progress</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Dispatched / Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{completedCount}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Fulfilled orders</span>
        </Card>
      </div>

      {/* Filter & Toolbar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order no, PO ref, client, or manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Client Dropdown Filter */}
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Manager Dropdown Filter */}
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Managers</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Orders DataTable */}
      <Card className="border border-border/60">
        <DataTable
          columns={columns}
          data={filteredOrders}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
        />
      </Card>

      {/* Modal: Create / Edit Order */}
      <OrderFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingOrder(null)
        }}
        initial={editingOrder}
        onSuccess={loadData}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingOrder)}
        onClose={() => setDeletingOrder(null)}
        title="Delete Customer Order"
      >
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete order{" "}
            <strong className="text-foreground font-mono">{deletingOrder?.orderNo}</strong>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingOrder(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Order
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
