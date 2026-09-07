"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { expensesApi } from "@/modules/expenses/lib/expenses-api"
import {
  Expense,
  ExpenseCategory,
  CreateExpensePayload,
  PayExpensePayload,
} from "@/modules/expenses/types/expense"
import {
  ArrowLeft,
  Receipt,
  DollarSign,
  Calendar,
  Clock,
  Paperclip,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CreditCard,
  Tag,
  FileCheck,
  Building2,
  Sparkles,
  User,
} from "lucide-react"

export default function ExpenseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const expenseId = params.id as string

  const [expense, setExpense] = useState<Expense | null>(null)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Edit Expense Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [expenseForm, setExpenseForm] = useState<CreateExpensePayload>({
    title: "",
    category: "",
    type: 0,
    expenseDate: "",
    dueDate: "",
    recurringFrequency: "One-time",
    reminderDays: 3,
    paymentMethod: "Bank Transfer",
    status: "pending",
    vendorName: "",
    notes: "",
  })

  // Pay Modal State
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)
  const [payForm, setPayForm] = useState<PayExpensePayload>({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    receipt: null,
  })
  const [receiptError, setReceiptError] = useState<string | null>(null)

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const loadCategories = async () => {
    try {
      const res = await expensesApi.getExpenseCategories()
      setCategories(res.data)
    } catch (err) {
      console.error("Failed to load categories:", err)
    }
  }

  const fetchExpenseDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await expensesApi.getExpenseById(expenseId)
      setExpense(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load expense details.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    if (expenseId) {
      fetchExpenseDetail()
    }
  }, [expenseId])

  const handleOpenEdit = () => {
    if (!expense) return
    setExpenseForm({
      title: expense.title,
      category: expense.category,
      type: Number(expense.type || 0),
      expenseDate: expense.expenseDate,
      dueDate: expense.dueDate || "",
      recurringFrequency: expense.recurringFrequency || "One-time",
      reminderDays: expense.reminderDays ?? 3,
      paymentMethod: expense.paymentMethod || "Bank Transfer",
      status: expense.status || "pending",
      vendorName: expense.vendorName || "",
      notes: expense.notes || "",
    })
    setIsEditOpen(true)
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expense) return

    setIsSubmittingEdit(true)
    setError(null)

    try {
      const res = await expensesApi.updateExpense(expense.id, expenseForm)
      setExpense((prev) => (prev ? { ...prev, ...res.data } : res.data))
      showNotification("Expense updated successfully.")
      setIsEditOpen(false)
    } catch (err: any) {
      setError(err.message || "Failed to update expense.")
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleOpenPay = () => {
    if (!expense) return
    setReceiptError(null)
    setPayForm({
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: expense.paymentMethod && expense.paymentMethod !== "Immediate" ? expense.paymentMethod : "Bank Transfer",
      receipt: null,
    })
    setIsPayOpen(true)
  }

  const handleSubmitPay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expense) return

    setIsSubmittingPay(true)
    setError(null)
    setReceiptError(null)

    try {
      const res = await expensesApi.payExpense(expense.id, payForm)
      setExpense((prev) => (prev ? { ...prev, ...res.data } : res.data))
      showNotification("Expense payment recorded successfully.")
      setIsPayOpen(false)
    } catch (err: any) {
      setReceiptError(err.message || "Failed to process payment.")
    } finally {
      setIsSubmittingPay(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!expense) return

    setIsSubmittingDelete(true)
    setError(null)

    try {
      await expensesApi.deleteExpense(expense.id)
      router.push("/expenses")
    } catch (err: any) {
      setError(err.message || "Failed to delete expense.")
      setIsSubmittingDelete(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading expense profile...</span>
        </div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Expense Record Not Found"
          description={`Expense record #${expenseId} does not exist.`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/expenses">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Expense Directory
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const isPaid = expense.status?.toLowerCase() === "paid"

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={expense.title}
        description={`Expense Record & Payment Settlement (ID: #${expense.id})`}
        badge={
          isPaid ? (
            <Badge variant="success" className="gap-1 font-mono">
              <FileCheck className="h-3 w-3" /> Status: Paid
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1 font-mono">
              <Clock className="h-3 w-3" /> Status: {expense.status}
            </Badge>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/expenses">
                <ArrowLeft className="h-4 w-4" /> Back to Directory
              </Link>
            </Button>
            {!isPaid && (
              <Button onClick={handleOpenPay} variant="default" size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <CreditCard className="h-4 w-4" /> Pay & Upload Receipt
              </Button>
            )}
            <Button onClick={handleOpenEdit} variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" /> Edit Record
            </Button>
            <Button onClick={() => setIsDeleteOpen(true)} variant="destructive" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      {/* Notification Banner */}
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

      {/* Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Expense Amount</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{Number(expense.type || 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Numeric type field</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Expense Category</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{expense.category}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Joined by category name</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Payment Method</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">{expense.paymentMethod || "Not specified"}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {expense.paidOn ? `Paid on ${expense.paidOn}` : "Unsettled disbursement"}
          </span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Recurring Frequency</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground">
            {expense.recurringFrequency || "One-time"}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            Reminder: {expense.reminderDays ? `${expense.reminderDays} days prior` : "Off"}
          </span>
        </Card>
      </div>

      {/* Main Grid Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: Expense Details & Schedule */}
        <Card className="border border-border/60">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Expense Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Title / Description</span>
              <span className="font-bold text-foreground">{expense.title}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Category Name</span>
              <span className="font-bold text-primary">{expense.category}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Building2 className="h-3 w-3 text-primary" /> Vendor / Payee
              </span>
              <span className="font-semibold text-foreground">{expense.vendorName || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" /> Expense Date
              </span>
              <span className="font-semibold text-foreground font-mono">{expense.expenseDate}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" /> Due Date
              </span>
              <span className="font-semibold text-foreground font-mono">{expense.dueDate || "No Due Date"}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" /> Created By
              </span>
              <span className="font-semibold text-foreground">User #{expense.createdBy || "System"}</span>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-muted-foreground font-medium block">Expense Notes</span>
              <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/40">
                {expense.notes || "No additional notes provided for this expense."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Receipt & Settlement Info */}
        <Card className="border border-border/60 flex flex-col">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-emerald-500" /> Payment Receipt & Settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
            {expense.receiptUrl ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Paperclip className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="font-bold text-foreground text-xs block truncate">
                        {expense.receiptFileName || "Payment Receipt"}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono">
                        Settled on: {expense.paidOn || "Recorded"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                    <Button asChild size="sm" variant="default" className="gap-1.5 flex-1 text-xs">
                      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> View / Download Receipt
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-1.5 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Auto-Settlement Metadata
                  </span>
                  <div className="font-mono text-[11px] text-muted-foreground space-y-1 pt-1">
                    <div>Payment Method: {expense.paymentMethod || "Immediate"}</div>
                    <div>Paid On Date: {expense.paidOn || "Auto-Set"}</div>
                    <div>Receipt URL: {expense.receiptUrl}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground space-y-3">
                <Paperclip className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <p className="font-semibold text-foreground">No receipt file uploaded for this expense.</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isPaid ? "Payment recorded without a file attachment." : "Click 'Pay & Upload Receipt' to settle."}
                  </p>
                </div>
                {!isPaid && (
                  <Button onClick={handleOpenPay} size="sm" className="gap-1.5 mt-2 text-xs bg-emerald-600 hover:bg-emerald-700">
                    <CreditCard className="h-3.5 w-3.5" /> Pay Expense & Upload Receipt
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal 1: Edit Expense */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Expense Record" maxWidth="lg">
        <form onSubmit={handleUpdateExpense} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Expense Title *</label>
            <Input
              value={expenseForm.title}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category Name *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Amount (₹ Type)</label>
              <Input
                type="number"
                min={0}
                value={expenseForm.type || 0}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, type: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Expense Date (YYYY-MM-DD) *</label>
              <Input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Due Date (YYYY-MM-DD)</label>
              <Input
                type="date"
                value={expenseForm.dueDate || ""}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Frequency</label>
              <select
                value={expenseForm.recurringFrequency || "One-time"}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, recurringFrequency: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              >
                <option value="One-time">One-time</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Payment Method</label>
              <select
                value={expenseForm.paymentMethod || "Bank Transfer"}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="Immediate">Immediate</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status *</label>
              <select
                value={expenseForm.status}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                required
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="overdue">overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Vendor / Payee Name</label>
            <Input
              value={expenseForm.vendorName || ""}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendorName: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes / Purpose</label>
            <Input
              value={expenseForm.notes || ""}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingEdit}>
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Pay Expense & Upload Receipt */}
      <Dialog open={isPayOpen} onClose={() => setIsPayOpen(false)} title="Record Payment & Upload Receipt" maxWidth="md">
        <form onSubmit={handleSubmitPay} className="space-y-4 mt-2">
          {receiptError && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{receiptError}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Payment Date *</label>
              <Input
                type="date"
                value={payForm.paymentDate}
                onChange={(e) => setPayForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Payment Method *</label>
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground"
                required
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl border border-border/60 bg-muted/20">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-primary" /> Receipt Document (Optional)
            </label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setPayForm((prev) => ({ ...prev, receipt: file }))
              }}
              className="text-xs cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground block">
              Accepted formats: JPG, JPEG, PNG, PDF. Maximum size: 2MB.
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsPayOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingPay}>
              {isSubmittingPay ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Submit Payment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Delete Confirmation */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Expense Record">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete expense record{" "}
            <strong className="text-foreground font-semibold">"{expense.title}"</strong>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpense} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Expense
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
