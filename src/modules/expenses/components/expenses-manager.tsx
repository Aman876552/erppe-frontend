"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { expensesApi } from "@/modules/expenses/lib/expenses-api"
import {
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Paperclip,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Loader2,
  AlertTriangle,
  FileCheck,
  Tag,
} from "lucide-react"

export type ExpenseRow = {
  id: string
  title: string
  category: string
  amount: number
  type: string // "IMMEDIATE" | "PLANNED" | "RECURRING"
  expenseDate: string
  recurringFrequency: string | null
  reminderDays: number | null
  paymentMethod: string | null
  status: string
  notes: string | null
  receiptUrl: string | null
  receiptFileName: string | null
  paidOn: string | null
}

type CategoryOption = { id: string; name: string }
type ExpenseType = "IMMEDIATE" | "PLANNED" | "RECURRING"
type Tab = "ready" | "paid" | "upcoming"

const PAGE_SIZE = 10
const PAYMENT_METHODS = ["Bank Transfer", "UPI", "Cash", "Cheque", "Card", "Auto-Debit"]

const TYPE_HINTS: Record<ExpenseType, string> = {
  IMMEDIATE: "Already paid — logged straight to Paid, no reminder needed.",
  PLANNED: "Due later — reminder before due date, confirm payment when paid.",
  RECURRING: "Repeats on schedule — next occurrence scheduled automatically once paid.",
}

const TYPE_DATE_LABELS: Record<ExpenseType, string> = {
  IMMEDIATE: "Payment Date *",
  PLANNED: "Due Date *",
  RECURRING: "Next Due Date *",
}

function money(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return "—"
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function shortId(id: string) {
  return "EXP-" + String(id).slice(0, 8).toUpperCase()
}

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function diffDays(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return 0
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function tabOf(e: ExpenseRow): Tab {
  if (String(e.status).toUpperCase() === "PAID") return "paid"
  return diffDays(e.expenseDate) <= 7 ? "ready" : "upcoming"
}

function statusMeta(e: ExpenseRow): { label: string; variant: "success" | "destructive" | "warning" | "outline" } {
  if (String(e.status).toUpperCase() === "PAID") return { label: "Paid", variant: "success" }
  const d = diffDays(e.expenseDate)
  if (d < 0) return { label: "Overdue", variant: "destructive" }
  if (d === 0) return { label: "Due Today", variant: "warning" }
  return { label: "Upcoming", variant: "outline" }
}

export function ExpensesManager({
  expenses,
  categories,
  onRefresh,
}: {
  expenses: ExpenseRow[]
  categories: CategoryOption[]
  onRefresh?: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("ready")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ mode: "add" | "edit"; expense?: ExpenseRow } | null>(null)
  const [payTarget, setPayTarget] = useState<ExpenseRow | null>(null)

  const handleRefresh = () => {
    if (onRefresh) onRefresh()
    router.refresh()
  }

  const counts = useMemo(() => {
    const c = { ready: 0, paid: 0, upcoming: 0 }
    for (const e of expenses) c[tabOf(e)]++
    return c
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = expenses.filter((e) => tabOf(e) === tab)
    if (q) {
      rows = rows.filter((e) =>
        (shortId(e.id) + " " + e.title + " " + e.category).toLowerCase().includes(q)
      )
    }
    return rows
  }, [expenses, tab, search])

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filteredExpenses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  async function handleDelete(e: ExpenseRow) {
    if (!confirm(`Delete "${e.title}"? This cannot be undone.`)) return
    try {
      await expensesApi.deleteExpense(e.id)
      handleRefresh()
    } catch (err: any) {
      alert(err.message || "Failed to delete expense")
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setTab("ready"); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === "ready"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Ready to Pay
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-extrabold">
              {counts.ready}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => { setTab("paid"); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === "paid"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-extrabold">
              {counts.paid}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => { setTab("upcoming"); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === "upcoming"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> Upcoming
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-extrabold">
              {counts.upcoming}
            </Badge>
          </button>
        </div>

        <Button size="sm" onClick={() => setModal({ mode: "add" })} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Filter Bar & Table Card */}
      <Card className="p-4 border border-border/60 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search expenses by title or category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
              <tr>
                <th className="p-3">Expense ID</th>
                <th className="p-3">Expense Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3">Status</th>
                <th className="p-3">Receipt</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground italic">
                    No expenses found for this view.
                  </td>
                </tr>
              ) : (
                pageRows.map((e) => {
                  const meta = statusMeta(e)
                  return (
                    <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-semibold text-foreground">{shortId(e.id)}</td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{e.title}</span>
                        {e.type === "RECURRING" && (
                          <span className="text-[10px] text-muted-foreground block">
                            🔁 {e.recurringFrequency}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Tag className="h-2.5 w-2.5 text-primary" /> {e.category}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono font-bold text-foreground">{money(e.amount)}</td>
                      <td className="p-3">{fmtDate(e.expenseDate)}</td>
                      <td className="p-3">{e.paymentMethod || "—"}</td>
                      <td className="p-3">
                        <Badge variant={meta.variant} className="text-[10px]">
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {e.receiptUrl ? (
                          <a
                            href={e.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                          >
                            <Paperclip className="h-3 w-3" /> Receipt
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {String(e.status).toUpperCase() !== "PAID" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setPayTarget(e)}
                              className="h-7 px-2 text-[11px] text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 font-bold"
                            >
                              ✓ Pay
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setModal({ mode: "edit", expense: e })}
                            className="h-7 w-7 p-0"
                            title="Edit Expense"
                          >
                            <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(e)}
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            {filteredExpenses.length
              ? `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filteredExpenses.length)} of ${filteredExpenses.length} records`
              : "0 records"}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="h-7 text-xs"
              >
                Prev
              </Button>
              <span className="px-2 font-semibold text-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Add / Edit Expense Dialog */}
      {modal && (
        <ExpenseFormModal
          mode={modal.mode}
          expense={modal.expense}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            handleRefresh()
          }}
        />
      )}

      {/* Pay Modal Dialog */}
      {payTarget && (
        <PayModal
          expense={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={() => {
            setPayTarget(null)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}

function ExpenseFormModal({
  mode,
  expense,
  categories,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit"
  expense?: ExpenseRow
  categories: CategoryOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(expense?.title ?? "")
  const [category, setCategory] = useState(expense?.category ?? categories[0]?.name ?? "")
  const [amount, setAmount] = useState(expense ? String(expense.amount || "") : "")
  const [type, setType] = useState<ExpenseType>((expense?.type as ExpenseType) ?? "IMMEDIATE")
  const [frequency, setFrequency] = useState(expense?.recurringFrequency ?? "monthly")
  const [date, setDate] = useState(expense?.expenseDate ?? todayStr())
  const [reminderDays, setReminderDays] = useState(
    expense?.reminderDays != null ? String(expense.reminderDays) : "3"
  )
  const [notes, setNotes] = useState(expense?.notes ?? "")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!title.trim()) return setError("Enter an expense title")
    if (!category) return setError("Choose a category")
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return setError("Enter a valid amount")
    if (!date) return setError(type === "IMMEDIATE" ? "Pick payment date" : "Pick due date")
    if (type === "RECURRING" && !frequency) return setError("Choose frequency")

    setBusy(true)
    setError(null)
    try {
      const payload: any = {
        title: title.trim(),
        category,
        type: amt,
        amount: amt,
        expenseDate: date,
        dueDate: date,
        recurringFrequency: type === "RECURRING" ? frequency : undefined,
        reminderDays: type === "IMMEDIATE" ? undefined : Number(reminderDays),
        status: type === "IMMEDIATE" ? "paid" : (expense?.status || "pending"),
        notes: notes.trim() || undefined,
      }

      if (mode === "edit" && expense) {
        await expensesApi.updateExpense(expense.id, payload)
      } else {
        await expensesApi.createExpense(payload)
      }
      onSaved()
    } catch (err: any) {
      setError(err.message || "Failed to save expense")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title={mode === "edit" ? "Edit Expense" : "Add New Expense"} maxWidth="lg">
      <div className="space-y-4 mt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">Expense Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Office Rent - July, Machine Parts..."
              className="text-xs"
              disabled={busy}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={busy}
            >
              {categories.length === 0 && <option value="">No categories available</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Amount (₹) *</label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="text-xs"
              disabled={busy}
            />
          </div>

          {/* Expense Type Selector */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">Expense Type</label>
            <div className="flex flex-wrap gap-2">
              {(["IMMEDIATE", "PLANNED", "RECURRING"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => !busy && setType(t)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    type === t
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t === "IMMEDIATE" ? "⚡ Immediate" : t === "PLANNED" ? "📅 Planned" : "🔁 Recurring"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{TYPE_HINTS[type]}</p>
          </div>

          {type === "RECURRING" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Recurring Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                disabled={busy}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">{TYPE_DATE_LABELS[type]}</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs"
              disabled={busy}
            />
          </div>

          {type !== "IMMEDIATE" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reminder Notification</label>
              <select
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                disabled={busy}
              >
                <option value="7">7 days before due</option>
                <option value="3">3 days before due</option>
                <option value="1">1 day before due</option>
                <option value="0">On due date</option>
              </select>
            </div>
          )}

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">Notes / Purpose</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional operational notes..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs outline-none focus:border-primary"
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy} size="sm">
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={busy} size="sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {busy ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Expense"}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function PayModal({
  expense,
  onClose,
  onPaid,
}: {
  expense: ExpenseRow
  onClose: () => void
  onPaid: () => void
}) {
  const [paidOn, setPaidOn] = useState(todayStr())
  const [method, setMethod] = useState(expense.paymentMethod || PAYMENT_METHODS[0])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmPay() {
    if (!paidOn) return setError("Pick payment date")
    if (!method) return setError("Choose payment method")
    setBusy(true)
    setError(null)
    try {
      await expensesApi.payExpense(expense.id, {
        paymentDate: paidOn,
        paymentMethod: method,
        receipt: receiptFile,
      })
      onPaid()
    } catch (err: any) {
      setError(err.message || "Failed to record payment")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title="Confirm Expense Payment" maxWidth="md">
      <div className="space-y-4 mt-2">
        <div className="p-3 rounded-xl border border-border bg-muted/30 text-xs">
          <div className="flex justify-between items-center font-bold">
            <span className="text-foreground">{expense.title}</span>
            <span className="font-mono text-primary text-sm">{money(expense.amount)}</span>
          </div>
          <span className="text-[11px] text-muted-foreground block mt-1">
            Category: {expense.category} · Due: {fmtDate(expense.expenseDate)}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Payment Date *</label>
            <Input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className="text-xs"
              disabled={busy}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Payment Method *</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              disabled={busy}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-primary" /> Receipt / Payment Proof (Optional)
            </label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="text-xs cursor-pointer"
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy} size="sm">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirmPay}
            disabled={busy}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {busy ? "Processing..." : "✓ Confirm Payment"}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
