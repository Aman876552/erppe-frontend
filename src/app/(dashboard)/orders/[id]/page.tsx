"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ordersApi } from "@/modules/orders/lib/orders-api"
import { clientsApi } from "@/modules/clients/lib/clients-api"
import { usersApi, User } from "@/modules/core/lib/users-api"
import { Order } from "@/modules/orders/types/order"
import { Client } from "@/modules/clients/types/client"
import { OrderFormModal } from "@/modules/orders/components/order-form-modal"
import {
  ArrowLeft,
  ShoppingCart,
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  Building2,
  FileText,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  MapPin,
  CreditCard,
  Receipt,
  CheckCircle2,
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

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [managerUser, setManagerUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadOrder = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [orderRes, usersRes] = await Promise.all([
        ordersApi.getOrderById(id),
        usersApi.getUsers().catch(() => ({ data: [] })),
      ])
      const ord = orderRes.data
      setOrder(ord)

      if (ord?.orderManagerId) {
        const found = (usersRes.data || []).find((u) => String(u.id) === String(ord.orderManagerId))
        if (found) setManagerUser(found)
      }

      if (ord?.clientId) {
        try {
          const clientRes = await clientsApi.getClientById(ord.clientId)
          setClient(clientRes.data)
        } catch {
          // Client fetch fallback
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadOrder()
  }, [id])

  const handleToggleFreeze = async () => {
    if (!order) return
    const newFrozenAt = order.frozenAt ? null : new Date().toISOString()
    try {
      await ordersApi.updateOrder(order.id, { frozenAt: newFrozenAt })
      loadOrder()
    } catch (err: any) {
      alert(err.message || "Failed to update freeze status")
    }
  }

  const handleDelete = async () => {
    if (!order) return
    if (!confirm(`Delete order "${order.orderNo}"? This action cannot be undone.`)) return
    setIsDeleting(true)
    try {
      await ordersApi.deleteOrder(order.id)
      router.push("/orders")
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to delete order")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-medium">Loading Order Details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Orders
          </Link>
        </Button>
        <Card className="p-6 text-center border-red-500/30 bg-red-500/10 text-red-500 space-y-2">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
          <h3 className="font-bold text-sm">Order Not Found</h3>
          <p className="text-xs text-muted-foreground">{error || "The requested order does not exist."}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-foreground font-mono">{order.orderNo}</h2>
              <Badge variant={statusVariant(order.status)} className="font-bold text-xs">
                {order.status || "Draft"}
              </Badge>
              {order.frozenAt && (
                <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs">
                  <Lock className="h-3 w-3" /> Locked
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client ? `Client: ${client.name}` : `Client ID: ${order.clientId}`}
              {order.clientPoRef ? ` · PO Ref: ${order.clientPoRef}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleFreeze} className="gap-1.5 text-xs">
            {order.frozenAt ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {order.frozenAt ? "Unlock Order" : "Lock Order"}
          </Button>

          <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)} className="gap-1.5 text-xs">
            <Edit className="h-3.5 w-3.5" /> Edit Order
          </Button>

          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-1.5 text-xs">
            {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Lock Warning Banner */}
      {order.frozenAt && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              This order was frozen/locked on {new Date(order.frozenAt).toLocaleString()}. Details are preserved from further edits.
            </span>
          </div>
          <button onClick={handleToggleFreeze} className="underline text-xs font-bold hover:text-amber-700">
            Unlock
          </button>
        </div>
      )}

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Info (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card className="p-5 border border-border/60 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2.5">
              <ShoppingCart className="h-4 w-4 text-primary" /> Order Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Total Order Amount
                </span>
                <div className="text-xl font-extrabold text-foreground font-mono">{money(order.totalAmount)}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Order Status
                </span>
                <div>
                  <Badge variant={statusVariant(order.status)} className="font-bold">
                    {order.status || "Draft"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Order Date
                </span>
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.orderDate || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Overall Deadline
                </span>
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  {order.overallDeadline || "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Commercial & Billing Terms */}
          <Card className="p-5 border border-border/60 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2.5">
              <Receipt className="h-4 w-4 text-primary" /> Commercial &amp; Billing Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Commercial Terms
                </span>
                <div className="text-xs font-medium text-foreground">{order.commercialTerms || "—"}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Tax &amp; Currency
                </span>
                <div className="text-xs font-medium text-foreground">{order.taxAndCurrency || "—"}</div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                  Billing Location
                </span>
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {order.billingLocation || "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card className="p-5 border border-border/60 space-y-2">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                <FileText className="h-4 w-4 text-primary" /> Notes &amp; Specifications
              </h3>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar Cards (1 col) */}
        <div className="space-y-6">
          {/* Client Card */}
          <Card className="p-5 border border-border/60 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <Building2 className="h-4 w-4 text-primary" /> Client Profile
            </h3>

            {client ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-extrabold text-foreground block text-sm">{client.name}</span>
                  {client.clientCode && (
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      Code: {client.clientCode}
                    </span>
                  )}
                </div>
                {client.email && <div className="text-muted-foreground">Email: {client.email}</div>}
                {client.phone && <div className="text-muted-foreground">Phone: {client.phone}</div>}
                <div className="pt-2 border-t border-border/50">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs">
                    <Link href={`/clients/${client.id}`}>View Client Master</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Client ID: <span className="font-mono text-foreground font-bold">{order.clientId}</span></div>
                <div className="text-[10px] italic">Client profile details not linked or loaded.</div>
              </div>
            )}
          </Card>

          {/* Assigned Order Manager Card */}
          <Card className="p-5 border border-border/60 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <UserCheck className="h-4 w-4 text-primary" /> Assigned Manager
            </h3>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-foreground block">
                {order.assignedManager ||
                  managerUser?.name ||
                  (order as any).orderManager?.name ||
                  (order as any).order_manager?.name ||
                  "— Unassigned —"}
              </span>
              {managerUser?.email && (
                <span className="text-[10px] text-muted-foreground block">
                  {managerUser.email}
                </span>
              )}
              {order.orderManagerId && (
                <span className="text-[10px] text-muted-foreground font-mono block">
                  Manager ID: {order.orderManagerId}
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Order Modal */}
      <OrderFormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initial={order}
        onSuccess={loadOrder}
      />
    </div>
  )
}
