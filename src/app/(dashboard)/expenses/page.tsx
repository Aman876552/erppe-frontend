"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/modules/core/components/page-header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { DataTable, Column } from "@/modules/core/components/data-table/data-table"
import { expensesApi } from "@/modules/expenses/lib/expenses-api"
import {
  Expense,
  ExpenseCategory,
  CreateExpensePayload,
  PayExpensePayload,
} from "@/modules/expenses/types/expense"
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  DollarSign,
  Calendar,
  Clock,
  Paperclip,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  CreditCard,
  Tag,
  FolderPlus,
  RefreshCw,
  FileCheck,
  Building2,
  Sparkles,
} from "lucide-react"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all") // "all" | "pending" | "paid"

  // Expense Modal State (Create / Edit)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false)

  const [expenseForm, setExpenseForm] = useState<CreateExpensePayload>({
    title: "",
    category: "",
    type: 0,
    expenseDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    recurringFrequency: "One-time",
    reminderDays: 3,
    paymentMethod: "Bank Transfer",
    status: "pending",
    vendorName: "",
    notes: "",
  })

  // Pay Modal State
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null)
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)
  const [payForm, setPayForm] = useState<PayExpensePayload>({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    receipt: null,
  })
  const [receiptError, setReceiptError] = useState<string | null>(null)

  // Manage Categories Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoryNameInput, setCategoryNameInput] = useState("")
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)

  // Delete Expense Modal State
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  // Load Categories & Expenses
  const loadCategories = async () => {
    try {
      const res = await expensesApi.getExpenseCategories()
      setCategories(res.data)
      if (res.data.length > 0 && !expenseForm.category) {
        setExpenseForm((prev) => ({ ...prev, category: res.data[0].name }))
      }
    } catch (err: any) {
      console.error("Failed to load expense categories:", err)
    }
  }

  const loadExpenses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: any = {}
      if (selectedCategory !== "all") params.category = selectedCategory
      if (selectedStatus !== "all") params.status = selectedStatus
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const res = await expensesApi.getExpenses(params)
      setExpenses(res.data)
    } catch (err: any) {
      setError(err.message || "Failed to load expenses.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses()
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedStatus, searchQuery])

  // Single Expense Handlers
  const handleOpenCreateExpense = () => {
    setEditingExpense(null)
    setExpenseForm({
      title: "",
      category: categories[0]?.name || "",
      type: 0,
      expenseDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      recurringFrequency: "One-time",
      reminderDays: 3,
      paymentMethod: "Bank Transfer",
      status: "pending",
      vendorName: "",
      notes: "",
    })
    setIsExpenseModalOpen(true)
  }

  const handleOpenEditExpense = (item: Expense) => {
    setEditingExpense(item)
    setExpenseForm({
      title: item.title,
      category: item.category,
      type: Number(item.type || 0),
      expenseDate: item.expenseDate,
      dueDate: item.dueDate || "",
      recurringFrequency: item.recurringFrequency || "One-time",
      reminderDays: item.reminderDays ?? 3,
      paymentMethod: item.paymentMethod || "Bank Transfer",
      status: item.status || "pending",
      vendorName: item.vendorName || "",
      notes: item.notes || "",
    })
    setIsExpenseModalOpen(true)
  }

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingExpense(true)
    setError(null)

    try {
      if (editingExpense) {
        await expensesApi.updateExpense(editingExpense.id, expenseForm)
        showNotification(`Expense "${expenseForm.title}" updated successfully.`)
      } else {
        await expensesApi.createExpense(expenseForm)
        showNotification(`Expense "${expenseForm.title}" recorded successfully.`)
      }
      setIsExpenseModalOpen(false)
      loadExpenses()
    } catch (err: any) {
      setError(err.message || "Failed to save expense.")
    } finally {
      setIsSubmittingExpense(false)
    }
  }

  // Pay Expense Handlers
  const handleOpenPay = (item: Expense) => {
    setPayingExpense(item)
    setReceiptError(null)
    setPayForm({
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: item.paymentMethod && item.paymentMethod !== "Immediate" ? item.paymentMethod : "Bank Transfer",
      receipt: null,
    })
  }

  const handleSubmitPay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingExpense) return

    setIsSubmittingPay(true)
    setError(null)
    setReceiptError(null)

    try {
      const res = await expensesApi.payExpense(payingExpense.id, payForm)
      showNotification(`Payment recorded for "${payingExpense.title}".`)
      setPayingExpense(null)
      loadExpenses()
    } catch (err: any) {
      setReceiptError(err.message || "Failed to process payment.")
    } finally {
      setIsSubmittingPay(false)
    }
  }

  // Manage Category Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryNameInput.trim()) return

    setIsSubmittingCategory(true)
    setError(null)

    try {
      if (editingCategory) {
        await expensesApi.updateExpenseCategory(editingCategory.id, { name: categoryNameInput.trim() })
        showNotification(`Category renamed to "${categoryNameInput.trim()}".`)
      } else {
        await expensesApi.createExpenseCategory({ name: categoryNameInput.trim() })
        showNotification(`Expense category "${categoryNameInput.trim()}" created.`)
      }
      setCategoryNameInput("")
      setEditingCategory(null)
      loadCategories()
    } catch (err: any) {
      setError(err.message || "Failed to save category.")
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string | number) => {
    setIsSubmittingCategory(true)
    setError(null)
    try {
      await expensesApi.deleteExpenseCategory(id)
      showNotification("Expense category removed.")
      loadCategories()
    } catch (err: any) {
      setError(err.message || "Failed to delete category.")
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  // Delete Expense Handler
  const handleDeleteExpenseConfirm = async () => {
    if (!deletingExpense) return
    setIsSubmittingDelete(true)
    setError(null)

    try {
      await expensesApi.deleteExpense(deletingExpense.id)
      showNotification(`Expense "${deletingExpense.title}" deleted.`)
      setDeletingExpense(null)
      loadExpenses()
    } catch (err: any) {
      setError(err.message || "Failed to delete expense.")
    } finally {
      setIsSubmittingDelete(false)
    }
  }

  // Metrics Calculation
  const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.type || 0), 0)
  const paidCount = expenses.filter((e) => e.status?.toLowerCase() === "paid").length
  const paidAmount = expenses
    .filter((e) => e.status?.toLowerCase() === "paid")
    .reduce((acc, curr) => acc + Number(curr.type || 0), 0)
  const pendingCount = expenses.filter((e) => e.status?.toLowerCase() !== "paid").length
  const pendingAmount = expenses
    .filter((e) => e.status?.toLowerCase() !== "paid")
    .reduce((acc, curr) => acc + Number(curr.type || 0), 0)

  // Columns for DataTable
  const columns: Column<Expense>[] = [
    {
      key: "title",
      title: "Expense Details",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <Link
              href={`/expenses/${row.id}`}
              className="font-bold text-foreground hover:text-primary transition-colors text-xs"
            >
              {row.title}
            </Link>
            {row.vendorName && (
              <span className="block text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-2.5 w-2.5" /> Vendor: {row.vendorName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (row) => (
        <Badge variant="outline" className="gap-1 text-[10px] font-medium">
          <Tag className="h-2.5 w-2.5 text-primary" /> {row.category}
        </Badge>
      ),
    },
    {
      key: "type",
      title: "Amount (Type)",
      render: (row) => (
        <span className="text-xs font-mono font-bold text-foreground">
          ₹{Number(row.type || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "expenseDate",
      title: "Date & Schedule",
      render: (row) => (
        <div className="space-y-0.5 text-[11px]">
          <span className="font-mono text-foreground block flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" /> {row.expenseDate}
          </span>
          {row.dueDate && (
            <span className="text-[10px] text-muted-foreground block">Due: {row.dueDate}</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status & Payment",
      render: (row) => {
        const isPaid = row.status?.toLowerCase() === "paid"
        return (
          <div className="space-y-1">
            {isPaid ? (
              <Badge variant="success" className="gap-1 text-[10px]">
                <FileCheck className="h-3 w-3" /> Paid
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 text-[10px]">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            )}

            {isPaid && row.paidOn && (
              <span className="block text-[9px] text-muted-foreground font-mono">Paid: {row.paidOn}</span>
            )}
          </div>
        )
      },
    },
    {
      key: "receipt",
      title: "Receipt",
      render: (row) =>
        row.receiptUrl ? (
          <a
            href={row.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <Paperclip className="h-3 w-3" />
            <span>Receipt</span>
            <ExternalLink className="h-2.5 w-2.5 opacity-70" />
          </a>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">—</span>
        ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => {
        const isPaid = row.status?.toLowerCase() === "paid"
        return (
          <div className="flex items-center gap-1">
            {!isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPay(row)}
                className="h-7 text-[10px] px-2 gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                title="Record Payment & Upload Receipt"
              >
                <CreditCard className="h-3 w-3" /> Pay
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="View Details">
              <Link href={`/expenses/${row.id}`}>
                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEditExpense(row)}
              className="h-7 w-7 p-0"
              title="Edit Expense"
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingExpense(row)}
              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              title="Delete Expense"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Expense Management"
        description="Track operational expenses, payment receipts, due dates, and expense category lookups."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={loadExpenses} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button onClick={() => setIsCategoryModalOpen(true)} variant="outline" size="sm" className="gap-1.5">
              <FolderPlus className="h-3.5 w-3.5" /> Categories ({categories.length})
            </Button>
            <Button onClick={handleOpenCreateExpense} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Record Expense
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

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Expense Amount</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{totalAmount.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Across {expenses.length} records</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Settled / Paid</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{paidAmount.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">{paidCount} expenses settled</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending Disbursements</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            ₹{pendingAmount.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">{pendingCount} pending expenses</span>
        </Card>

        <Card className="p-4 border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Expense Categories</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{categories.length}</div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Category lookup names</span>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by expense title, vendor name, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Filter Toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 border border-border/50">
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedStatus === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("pending")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedStatus === "pending" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("paid")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedStatus === "paid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses DataTable */}
      <Card className="border border-border/60">
        <DataTable
          columns={columns}
          data={expenses}
          keyExtractor={(row) => String(row.id)}
          isLoading={isLoading}
        />
      </Card>

      {/* Modal 1: Create / Edit Expense */}
      <Dialog
        open={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={editingExpense ? "Edit Expense Record" : "Record New Expense"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitExpense} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Expense Title *</label>
            <Input
              value={expenseForm.title}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Office Rent - September or Travel Tickets"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Category Name *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                {categories.length === 0 ? (
                  <option value="">No Categories Configured</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Amount (₹ Type)</label>
              <Input
                type="number"
                min={0}
                value={expenseForm.type || 0}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, type: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 25000"
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
                <option value="Immediate">Immediate (Auto-Paid)</option>
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
                <option value="paid">paid (Auto-Paid)</option>
                <option value="overdue">overdue</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Vendor / Payee Name</label>
            <Input
              value={expenseForm.vendorName || ""}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, vendorName: e.target.value }))}
              placeholder="e.g. ABC Properties or Supplier Co."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Notes / Purpose</label>
            <Input
              value={expenseForm.notes || ""}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Includes monthly maintenance charges"
            />
          </div>

          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-[11px] text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Setting status to <strong>paid</strong> or method to <strong>Immediate</strong> triggers automatic settlement logic on the backend.
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingExpense}>
              {isSubmittingExpense ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              {editingExpense ? "Save Changes" : "Save Expense"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 2: Pay Expense & Upload Receipt (/api/expenses/{id}/pay) */}
      <Dialog
        open={Boolean(payingExpense)}
        onClose={() => setPayingExpense(null)}
        title={`Record Payment — ${payingExpense?.title}`}
        maxWidth="md"
      >
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
            <Button type="button" variant="outline" onClick={() => setPayingExpense(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmittingPay}>
              {isSubmittingPay ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Submit Payment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal 3: Manage Categories Lookup Table */}
      <Dialog
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Expense Categories Lookup"
        maxWidth="md"
      >
        <div className="space-y-4 mt-2">
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <Input
              placeholder={editingCategory ? `Rename "${editingCategory.name}"...` : "Enter new category name (e.g. Utilities)..."}
              value={categoryNameInput}
              onChange={(e) => setCategoryNameInput(e.target.value)}
              className="text-xs"
              required
            />
            <Button type="submit" size="sm" disabled={isSubmittingCategory} className="shrink-0 gap-1 text-xs">
              {isSubmittingCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {editingCategory ? "Update" : "Add"}
            </Button>
            {editingCategory && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryNameInput("")
                }}
                className="shrink-0 text-xs"
              >
                Cancel
              </Button>
            )}
          </form>

          <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto border rounded-xl p-2 bg-muted/10">
            {categories.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No expense categories created yet. Type a name above to create one.
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 text-xs">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(cat)
                        setCategoryNameInput(cat.name)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} size="sm">
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal 4: Delete Expense Confirmation */}
      <Dialog open={Boolean(deletingExpense)} onClose={() => setDeletingExpense(null)} title="Delete Expense Record">
        <div className="space-y-4 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete expense record{" "}
            <strong className="text-foreground font-semibold">"{deletingExpense?.title}"</strong>? This will permanently delete the expense and its receipt record.
          </p>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteExpenseConfirm} disabled={isSubmittingDelete}>
              {isSubmittingDelete ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Delete Expense
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
