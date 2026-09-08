"use client"

import React, { useEffect, useState, FormEvent } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { clientsApi } from "@/modules/clients/lib/clients-api"
import { usersApi, User } from "@/modules/core/lib/users-api"
import { ordersApi } from "@/modules/orders/lib/orders-api"
import { Client } from "@/modules/clients/types/client"
import { Order, ORDER_STATUSES, CreateOrderPayload } from "@/modules/orders/types/order"
import { Loader2, AlertTriangle, Lock, Unlock, Sparkles } from "lucide-react"

export function OrderFormModal({
  open,
  onClose,
  initial,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  initial?: Order | null
  onSuccess: () => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingLookups, setIsLoadingLookups] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateOrderPayload>({
    orderNo: initial?.orderNo ?? "",
    clientId: initial?.clientId ? String(initial.clientId) : "",
    clientPoRef: initial?.clientPoRef ?? "",
    orderDate: initial?.orderDate ?? new Date().toISOString().split("T")[0],
    commercialTerms: initial?.commercialTerms ?? "Net 30",
    taxAndCurrency: initial?.taxAndCurrency ?? "INR, GST 18%",
    billingLocation: initial?.billingLocation ?? "",
    orderManagerId: initial?.orderManagerId ? String(initial.orderManagerId) : "",
    assignedManager: initial?.assignedManager ?? "",
    overallDeadline: initial?.overallDeadline ?? "",
    notes: initial?.notes ?? "",
    status: initial?.status ?? "Draft",
    totalAmount: initial?.totalAmount != null ? Number(initial.totalAmount) : 0,
    frozenAt: initial?.frozenAt ?? null,
  })

  useEffect(() => {
    if (open) {
      loadLookups()
    }
  }, [open])

  useEffect(() => {
    if (initial) {
      setForm({
        orderNo: initial.orderNo ?? "",
        clientId: initial.clientId ? String(initial.clientId) : "",
        clientPoRef: initial.clientPoRef ?? "",
        orderDate: initial.orderDate ?? new Date().toISOString().split("T")[0],
        commercialTerms: initial.commercialTerms ?? "Net 30",
        taxAndCurrency: initial.taxAndCurrency ?? "INR, GST 18%",
        billingLocation: initial.billingLocation ?? "",
        orderManagerId: initial.orderManagerId ? String(initial.orderManagerId) : "",
        assignedManager: initial.assignedManager ?? "",
        overallDeadline: initial.overallDeadline ?? "",
        notes: initial.notes ?? "",
        status: initial.status ?? "Draft",
        totalAmount: initial.totalAmount != null ? Number(initial.totalAmount) : 0,
        frozenAt: initial.frozenAt ?? null,
      })
    } else {
      const year = new Date().getFullYear()
      const randomSuffix = Math.floor(100 + Math.random() * 900)
      setForm({
        orderNo: `ORD-${year}-${randomSuffix}`,
        clientId: "",
        clientPoRef: "",
        orderDate: new Date().toISOString().split("T")[0],
        commercialTerms: "Net 30",
        taxAndCurrency: "INR, GST 18%",
        billingLocation: "",
        orderManagerId: "",
        assignedManager: "",
        overallDeadline: "",
        notes: "",
        status: "Draft",
        totalAmount: 0,
        frozenAt: null,
      })
    }
  }, [initial, open])

  const loadLookups = async () => {
    setIsLoadingLookups(true)
    try {
      const [clientsRes, usersRes] = await Promise.all([
        clientsApi.getClients(),
        usersApi.getUsers(),
      ])
      setClients(clientsRes.data || [])
      setUsers(usersRes.data || [])
    } catch (err) {
      console.error("Failed to load clients/users lookups:", err)
    } finally {
      setIsLoadingLookups(false)
    }
  }

  const handleManagerSelect = (userId: string) => {
    if (!userId) {
      setForm((prev) => ({ ...prev, orderManagerId: "", assignedManager: "" }))
      return
    }
    const foundUser = users.find((u) => String(u.id) === String(userId))
    setForm((prev) => ({
      ...prev,
      orderManagerId: String(userId),
      assignedManager: foundUser ? foundUser.name : "",
    }))
  }

  const toggleFreeze = () => {
    setForm((prev) => ({
      ...prev,
      frozenAt: prev.frozenAt ? null : new Date().toISOString(),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.orderNo.trim()) {
      setError("Order number is required.")
      return
    }
    if (!form.clientId) {
      setError("Please select a valid Client from the dropdown.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        orderNo: form.orderNo.trim(),
        clientId: String(form.clientId),
        clientPoRef: form.clientPoRef?.trim() || undefined,
        orderDate: form.orderDate?.trim() || undefined,
        commercialTerms: form.commercialTerms?.trim() || undefined,
        taxAndCurrency: form.taxAndCurrency?.trim() || undefined,
        billingLocation: form.billingLocation?.trim() || undefined,
        orderManagerId: form.orderManagerId ? String(form.orderManagerId) : undefined,
        assignedManager: form.assignedManager?.trim() || undefined,
        overallDeadline: form.overallDeadline?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        status: form.status || "Draft",
        totalAmount: Number(form.totalAmount) || 0,
        frozenAt: form.frozenAt || undefined,
      }

      if (initial?.id) {
        await ordersApi.updateOrder(initial.id, payload)
      } else {
        await ordersApi.createOrder(payload)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        const errObj = err.response.data.errors
        const messages = Object.entries(errObj)
          .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
          .join(" | ")
        setError(messages || err.message || "Validation failed.")
      } else {
        setError(err.message || "Failed to save order record.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? `Edit Order — ${initial.orderNo}` : "New Customer Order"}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Order No */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Order Number / Code *</label>
            <Input
              value={form.orderNo}
              onChange={(e) => setForm({ ...form, orderNo: e.target.value })}
              placeholder="e.g. ORD-2026-001"
              className="text-xs font-mono font-bold"
              required
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Client *</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
              disabled={isLoadingLookups}
            >
              <option value="">— Select Client —</option>
              {clients.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.clientCode ? `(${c.clientCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Client PO Ref */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Client PO Reference</label>
            <Input
              value={form.clientPoRef || ""}
              onChange={(e) => setForm({ ...form, clientPoRef: e.target.value })}
              placeholder="e.g. PO-4521"
              className="text-xs"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Order Status</label>
            <select
              value={form.status || "Draft"}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Order Date */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Order Date</label>
            <Input
              type="date"
              value={form.orderDate || ""}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
              className="text-xs"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Overall Deadline</label>
            <Input
              type="date"
              value={form.overallDeadline || ""}
              onChange={(e) => setForm({ ...form, overallDeadline: e.target.value })}
              className="text-xs"
            />
          </div>

          {/* Order Manager Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Assigned Order Manager</label>
            <select
              value={form.orderManagerId || ""}
              onChange={(e) => handleManagerSelect(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              disabled={isLoadingLookups}
            >
              <option value="">— Unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Total Amount */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Total Amount (₹)</label>
            <Input
              type="number"
              min="0"
              value={form.totalAmount || 0}
              onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
              placeholder="e.g. 150000"
              className="text-xs font-mono font-bold"
            />
          </div>

          {/* Commercial Terms */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Commercial Terms</label>
            <Input
              value={form.commercialTerms || ""}
              onChange={(e) => setForm({ ...form, commercialTerms: e.target.value })}
              placeholder="e.g. Net 30, 50% Advance"
              className="text-xs"
            />
          </div>

          {/* Tax & Currency */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Tax & Currency</label>
            <Input
              value={form.taxAndCurrency || ""}
              onChange={(e) => setForm({ ...form, taxAndCurrency: e.target.value })}
              placeholder="e.g. INR, GST 18%"
              className="text-xs"
            />
          </div>

          {/* Billing Location */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">Billing Location</label>
            <Input
              value={form.billingLocation || ""}
              onChange={(e) => setForm({ ...form, billingLocation: e.target.value })}
              placeholder="e.g. Bangalore HO or Custom Site"
              className="text-xs"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">Order Notes / Specifications</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Special dispatch guidelines, packaging requirements, terms..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs outline-none focus:border-primary"
            />
          </div>

          {/* Freeze / Lock State Toggle */}
          <div className="md:col-span-2 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {form.frozenAt ? (
                <Lock className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Unlock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {form.frozenAt ? "Order Frozen / Locked" : "Order Unlocked"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {form.frozenAt
                    ? `Locked from edits on ${new Date(form.frozenAt).toLocaleString()}`
                    : "Order details can be edited freely"}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant={form.frozenAt ? "destructive" : "outline"}
              size="sm"
              onClick={toggleFreeze}
              className="text-xs h-8"
            >
              {form.frozenAt ? "Unlock Order" : "Lock Order"}
            </Button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {isSubmitting ? "Saving..." : initial ? "Save Changes" : "Create Order"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
